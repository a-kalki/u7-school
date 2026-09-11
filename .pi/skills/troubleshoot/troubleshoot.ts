#!/usr/bin/env bun
/**
 * CLI реестра известных проблем (скилл troubleshoot).
 *
 * Данные живут в conductor/code_styleguides/troubleshoots/:
 *   - *.md — записи (Симптомы / Причина / Решение);
 *   - registry.json — метаданные, метрики использования и policy чистки.
 *
 * Все команды сами обновляют метрики. Вручную registry.json не редактировать.
 *
 * Команды:
 *   search [запрос]   — поиск по тегам/описанию/симптомам (без запроса — весь реестр)
 *   show <id>         — напечатать решение (инкремент opened)
 *   info <id>         — метаданные и метрики записи
 *   helped <id>       — пометить «решение помогло» (вызывать после успешного применения)
 *   add --file <имя.md> --tags "a,b" --desc "..." [--symptoms "..."] — зарегистрировать запись
 *   remove <id> --yes — удалить запись и её файл (только после подтверждения пользователем)
 *   audit             — ревизия: статусы, кандидаты на удаление, сироты, сводка
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';

// --- Пути ------------------------------------------------------------------

const PROJECT_ROOT = resolve(import.meta.dir, '..', '..', '..');
const REGISTRY_DIR = join(
  PROJECT_ROOT,
  'conductor',
  'code_styleguides',
  'troubleshoots',
);
const REGISTRY_PATH = join(REGISTRY_DIR, 'registry.json');
const SELF = 'bun .pi/skills/troubleshoot/troubleshoot.ts';

// --- Типы ------------------------------------------------------------------

interface Entry {
  tags: string[];
  description: string;
  symptoms: string[];
  file: string;
  created_at: string;
  shown: number;
  opened: number;
  helped: number;
  last_shown_at: string | null;
  last_used_at: string | null;
}

interface Policy {
  zombie_days: number;
  invisible_days: number;
  stale_days: number;
}

interface Registry {
  policy: Policy;
  entries: Record<string, Entry>;
}

const DEFAULT_POLICY: Policy = {
  zombie_days: 120,
  invisible_days: 180,
  stale_days: 365,
};

// --- Хранилище --------------------------------------------------------------

function die(msg: string): never {
  console.error(`Ошибка: ${msg}`);
  process.exit(1);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_PATH)) {
    die(`реестр не найден: ${REGISTRY_PATH}`);
  }
  const raw = JSON.parse(
    readFileSync(REGISTRY_PATH, 'utf8'),
  ) as Partial<Registry>;
  const entries = (raw.entries ?? {}) as Record<string, Entry>;
  return { policy: { ...DEFAULT_POLICY, ...raw.policy }, entries };
}

function saveRegistry(reg: Registry): void {
  const sorted: Record<string, Entry> = {};
  for (const id of Object.keys(reg.entries).sort()) {
    sorted[id] = reg.entries[id] as Entry;
  }
  writeFileSync(
    REGISTRY_PATH,
    `${JSON.stringify({ policy: reg.policy, entries: sorted }, null, 2)}\n`,
  );
}

// --- Статусы (policy чистки) -------------------------------------------------

function ageDays(from: string): number {
  return Math.floor((Date.now() - Date.parse(from)) / 86_400_000);
}

interface Status {
  mark: string;
  label: string;
  reason: string;
}

function statusOf(e: Entry, p: Policy): Status {
  const age = ageDays(e.created_at);
  if (e.helped === 0 && e.opened > 0 && age > p.zombie_days) {
    return {
      mark: '🔴',
      label: 'к удалению',
      reason: `helped=0 при opened=${e.opened}, возраст ${age}д (> ${p.zombie_days}д) — находили, но решение не помогало`,
    };
  }
  if (e.helped === 0 && e.opened === 0 && age > p.invisible_days) {
    return {
      mark: '🔵',
      label: 'невидимка',
      reason: `ни разу не открыта за ${age}д (> ${p.invisible_days}д) — улучши symptoms/теги или удали`,
    };
  }
  if (e.helped > 0) {
    const idle = ageDays(e.last_used_at ?? e.created_at);
    if (idle > p.stale_days) {
      return {
        mark: '🟡',
        label: 'спящая',
        reason: `helped=${e.helped}, но не используется ${idle}д (> ${p.stale_days}д) — спроси пользователя`,
      };
    }
  }
  return { mark: '🟢', label: 'ок', reason: '' };
}

// --- Вспомогательные ----------------------------------------------------------

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === undefined || !a.startsWith('--')) continue;
    const value = args[i + 1];
    if (value === undefined || value.startsWith('--')) {
      die(`флаг ${a} требует значение (${a} <значение>)`);
    }
    flags[a.slice(2)] = value;
    i += 1;
  }
  return flags;
}

function splitList(src: string): string[] {
  return src
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function resolveId(reg: Registry, q: string): string {
  if (reg.entries[q]) return q;
  const prefixes = Object.keys(reg.entries).filter((id) =>
    id.startsWith(q.toLowerCase()),
  );
  if (prefixes.length === 1) {
    const hit = prefixes[0];
    if (hit !== undefined) return hit;
  }
  const hint =
    prefixes.length > 1
      ? `Уточни id: ${prefixes.join(', ')}.`
      : 'Похожих id нет.';
  die(
    `запись «${q}» не найдена. ${hint} Поиск: ${SELF} search "<текст ошибки>"`,
  );
}

function printEntryShort(id: string, e: Entry): void {
  const tags = e.tags.map((t) => `#${t}`).join(' ');
  console.log(`\n${id}  📖${e.opened} ✅${e.helped}  ${tags}`);
  console.log(`  ${e.description}`);
}

// --- Команды -------------------------------------------------------------------

function cmdSearch(args: string[]): void {
  const reg = loadRegistry();
  const ids = Object.keys(reg.entries);
  const query = args.join(' ').trim();
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^#/, ''))
    .filter(Boolean);

  const hits = ids
    .map((id) => {
      const e = reg.entries[id] as Entry;
      if (words.length === 0) return { id, e, score: 1 };
      const hay = [...e.tags, e.description, ...e.symptoms]
        .join(' ')
        .toLowerCase();
      return { id, e, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((h) => h.score > 0);

  hits.sort(
    (a, b) =>
      b.score - a.score || b.e.helped - a.e.helped || b.e.opened - a.e.opened,
  );

  if (hits.length === 0) {
    console.log(
      `По «${query}» ничего не найдено (всего записей: ${ids.length}).`,
    );
    console.log(
      'Попробуй другое слово из текста ошибки либо посмотри весь реестр: search без аргументов.',
    );
    return;
  }

  const header = query
    ? `Поиск «${query}» — найдено ${hits.length} из ${ids.length}:`
    : `Реестр (${ids.length}):`;
  console.log(header);
  for (const h of hits) printEntryShort(h.id, h.e);
  console.log(
    `\nЧитать решение: ${SELF} show <id> | метаданные: ${SELF} info <id>`,
  );

  // Метрика находимости — только для содержательного запроса.
  if (words.length > 0) {
    for (const h of hits) {
      h.e.shown += 1;
      h.e.last_shown_at = today();
    }
    saveRegistry(reg);
  }
}

function cmdShow(args: string[]): void {
  const q = args[0];
  if (!q) die(`использование: ${SELF} show <id>`);
  const reg = loadRegistry();
  const id = resolveId(reg, q);
  const e = reg.entries[id] as Entry;
  const path = join(REGISTRY_DIR, e.file);
  if (!existsSync(path)) {
    die(
      `файл записи отсутствует: ${path} (сирота). Восстанови файл или удали запись: ${SELF} remove ${id} --yes`,
    );
  }
  console.log(readFileSync(path, 'utf8'));
  e.opened += 1;
  e.last_used_at = today();
  saveRegistry(reg);
  console.log(
    `\n— ${id}: opened=${e.opened}, helped=${e.helped}. Если решение сработало: ${SELF} helped ${id}`,
  );
}

function cmdInfo(args: string[]): void {
  const q = args[0];
  if (!q) die(`использование: ${SELF} info <id>`);
  const reg = loadRegistry();
  const id = resolveId(reg, q);
  const e = reg.entries[id] as Entry;
  const st = statusOf(e, reg.policy);
  console.log(`id:          ${id}`);
  console.log(
    `файл:        conductor/code_styleguides/troubleshoots/${e.file}`,
  );
  console.log(`теги:        ${e.tags.map((t) => `#${t}`).join(' ')}`);
  console.log(`описание:    ${e.description}`);
  if (e.symptoms.length > 0) {
    console.log(`симптомы:    ${e.symptoms.join('; ')}`);
  }
  console.log(
    `метрики:     shown=${e.shown} opened=${e.opened} helped=${e.helped}`,
  );
  console.log(`создана:     ${e.created_at}`);
  console.log(
    `показ:       ${e.last_shown_at ?? '—'} | использование: ${e.last_used_at ?? '—'}`,
  );
  console.log(
    `статус:      ${st.mark} ${st.label}${st.reason ? ` — ${st.reason}` : ''}`,
  );
}

function cmdHelped(args: string[]): void {
  const q = args[0];
  if (!q) die(`использование: ${SELF} helped <id>`);
  const reg = loadRegistry();
  const id = resolveId(reg, q);
  const e = reg.entries[id] as Entry;
  e.helped += 1;
  e.last_used_at = today();
  saveRegistry(reg);
  console.log(`Отмечено: решение «${id}» помогло (helped=${e.helped}).`);
}

function printRevisionHints(reg: Registry): void {
  const problems = Object.entries(reg.entries)
    .map(([id, e]) => ({ id, e, st: statusOf(e, reg.policy) }))
    .filter((x) => x.st.label !== 'ок');
  const orphans = readdirSync(REGISTRY_DIR)
    .filter(
      (f) =>
        f.endsWith('.md') &&
        !Object.values(reg.entries).some((e) => e.file === f),
    )
    .map((f) => f.replace(/\.md$/, ''));

  const lines: string[] = [];
  for (const p of problems.slice(0, 6)) {
    lines.push(`  ${p.st.mark} ${p.id} (${p.st.label}): ${p.st.reason}`);
  }
  if (problems.length > 6) lines.push(`  …и ещё ${problems.length - 6}`);
  for (const o of orphans.slice(0, 4)) {
    lines.push(
      `  ⚠️ ${o}.md — файл есть, записи в реестре нет: зарегистрируй (add) или удали файл`,
    );
  }
  if (lines.length === 0) return;

  console.log('\nРевизия (сообщи пользователю в финальном отчёте):');
  for (const l of lines) console.log(l);
}

function cmdAdd(args: string[]): void {
  const flags = parseFlags(args);
  const { file, tags, desc } = flags;
  if (!file || !tags || !desc) {
    die(
      `нужны флаги: --file <имя.md> --tags "a,b" --desc "краткое описание" [--symptoms "фразы из текста ошибки"]`,
    );
  }
  const name = basename(file);
  if (!name.endsWith('.md')) die(`файл должен быть .md в ${REGISTRY_DIR}`);
  const path = join(REGISTRY_DIR, name);
  if (!existsSync(path)) {
    die(
      `файл не найден: ${path}. Сначала создай запись-файл, потом регистрируй.`,
    );
  }

  const id = name.replace(/\.md$/, '');
  const reg = loadRegistry();
  if (reg.entries[id]) die(`«${id}» уже есть в реестре.`);

  reg.entries[id] = {
    tags: splitList(tags),
    description: desc,
    symptoms: flags.symptoms ? splitList(flags.symptoms) : [],
    file: name,
    created_at: today(),
    shown: 0,
    opened: 0,
    helped: 0,
    last_shown_at: null,
    last_used_at: null,
  };
  saveRegistry(reg);
  console.log(
    `Добавлено: ${id} (теги: ${reg.entries[id]?.tags.map((t) => `#${t}`).join(' ')})`,
  );
  printRevisionHints(reg);
}

function cmdRemove(args: string[]): void {
  const q = args.find((a) => !a.startsWith('--'));
  const yes = args.includes('--yes');
  if (!q) die(`использование: ${SELF} remove <id> --yes`);
  const reg = loadRegistry();
  const id = resolveId(reg, q);
  const e = reg.entries[id] as Entry;

  if (!yes) {
    console.log(
      `Будет удалено: запись «${id}» и файл conductor/code_styleguides/troubleshoots/${e.file}`,
    );
    console.log(
      `Метрики: shown=${e.shown} opened=${e.opened} helped=${e.helped}, создана ${e.created_at}`,
    );
    die(
      `Удаление только с явного подтверждения пользователя. Подтверждено — запускай: ${SELF} remove ${id} --yes`,
    );
  }

  delete reg.entries[id];
  saveRegistry(reg);
  const path = join(REGISTRY_DIR, e.file);
  if (existsSync(path)) unlinkSync(path);
  console.log(`Удалено: запись «${id}» и файл ${e.file}`);
}

function cmdAudit(): void {
  const reg = loadRegistry();
  const rows = Object.entries(reg.entries)
    .map(([id, e]) => ({ id, e, st: statusOf(e, reg.policy) }))
    .sort(
      (a, b) => a.st.label.localeCompare(b.st.label) || b.e.helped - a.e.helped,
    );

  const total = rows.length;
  const sum = rows.reduce(
    (acc, r) => ({
      shown: acc.shown + r.e.shown,
      opened: acc.opened + r.e.opened,
      helped: acc.helped + r.e.helped,
    }),
    { shown: 0, opened: 0, helped: 0 },
  );
  console.log(
    `Записей: ${total} | суммарно: shown=${sum.shown} opened=${sum.opened} helped=${sum.helped}`,
  );
  console.log(
    `Policy: zombie>${reg.policy.zombie_days}д, invisible>${reg.policy.invisible_days}д, stale>${reg.policy.stale_days}д\n`,
  );

  const okIds: string[] = [];
  for (const r of rows) {
    if (r.st.label === 'ок') {
      okIds.push(r.id);
    } else {
      console.log(`${r.st.mark} ${r.id} — ${r.st.label}`);
      console.log(`   ${r.st.reason}`);
    }
  }
  if (okIds.length > 0) {
    console.log(`\n🟢 ок (${okIds.length}): ${okIds.join(', ')}`);
  }

  const registered = new Set(rows.map((r) => r.e.file));
  const orphans = readdirSync(REGISTRY_DIR).filter(
    (f) => f.endsWith('.md') && !registered.has(f),
  );
  const missing = rows.filter((r) => !existsSync(join(REGISTRY_DIR, r.e.file)));
  for (const o of orphans) {
    console.log(`⚠️  Сирота-файл: ${o} — зарегистрируй (add) или удали файл`);
  }
  for (const m of missing) {
    console.log(
      `⚠️  Запись без файла: ${m.id} (${m.e.file}) — восстанови файл или remove ${m.id} --yes`,
    );
  }

  console.log(
    `\nУдаление — только после подтверждения пользователем: ${SELF} remove <id> --yes`,
  );
}

function usage(): void {
  console.log(`Реестр известных проблем. Команды:

  search [запрос]    поиск по тегам/описанию/симптомам; без запроса — весь реестр
  show <id>          напечатать решение (инкремент opened)
  info <id>          метаданные и метрики записи
  helped <id>        пометить «решение помогло»
  add --file <имя.md> --tags "a,b" --desc "..." [--symptoms "..."]  зарегистрировать запись
  remove <id> --yes  удалить запись и файл (только после подтверждения пользователем)
  audit              ревизия базы: статусы, сироты, сводка

Запуск: ${SELF} <команда> [аргументы]`);
}

// --- Точка входа ---------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'search':
    cmdSearch(rest);
    break;
  case 'show':
    cmdShow(rest);
    break;
  case 'info':
    cmdInfo(rest);
    break;
  case 'helped':
    cmdHelped(rest);
    break;
  case 'add':
    cmdAdd(rest);
    break;
  case 'remove':
    cmdRemove(rest);
    break;
  case 'audit':
    cmdAudit();
    break;
  default:
    usage();
    process.exit(cmd ? 1 : 0);
}
