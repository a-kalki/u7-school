import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { StreamDs } from '#domain/index';
import type { CategorizedStudent } from '#domain/types';
import type { Student } from '../../../domain/student/entity';
import { StudentPolicy } from '../../../domain/student/policy';

/**
 * US-8: Мониторинг прогресса группы.
 * Публичный список студентов с прогресс-барами.
 * Детальная карточка — кнопки действий только для ментора потока.
 */
export class MonitorStory extends U7BotUserStory {
  readonly name = 'monitor';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, id] = action.split(':');

    // Детальная карточка студента
    if (cmd === 'detail' && id) {
      return this.#handleDetail(id, actor);
    }

    // История шагов — ещё не реализована
    if (cmd === 'history' && id) {
      return {
        sendMessage: {
          text: '🚧 История шагов ещё не реализована, но скоро будет.',
        },
      };
    }

    // mark-abandoned — подтверждение
    if (cmd === 'mark-abandoned' && id) {
      return this.#handleMarkAbandonedConfirm(id, actor);
    }

    // mark-abandoned — выполнить
    if (cmd === 'mark-abandoned-confirm' && id) {
      return this.#handleMarkAbandonedExecute(id, actor, action);
    }

    // complete-student — выбор исхода
    if (cmd === 'complete' && id) {
      return this.#handleCompleteChoice(id);
    }

    // complete-student — подтверждение исхода (confirm-диалог)
    if (cmd === 'complete-confirm' && id) {
      return this.#handleCompleteConfirm(id, actor, action);
    }

    // complete-student — выполнение (после подтверждения)
    if (cmd === 'complete-confirm-confirm' && id) {
      return this.#handleCompleteExecute(id, actor, action);
    }

    if (cmd !== 'students' || !id) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleStudents(id, actor);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleStudents(streamId: string, actor: User): Promise<BotResponse> {
    const students = await this.appApi.execute(
      'list-stream-students',
      { streamId },
      actor.uuid,
    );

    const stream = await this.appApi.execute('get-stream', {
      streamId,
    });

    if (!stream) {
      return { sendMessage: { text: '⚠️ Поток не найден' } };
    }

    // Категоризируем через DS
    const categorized = StreamDs.categorizeStudents(students, new Date());
    const lagMap = new Map(categorized.map((c) => [c.studentId, c.lagLevel]));

    // Считаем прогресс и собираем данные для каждого студента
    interface StudentRow {
      student: Student;
      name: string;
      progress: { completed: number; total: number; percent: number };
      lagLevel: CategorizedStudent['lagLevel'];
    }

    const rows: StudentRow[] = [];
    for (const s of students) {
      const progress = StreamDs.computeProgress(stream.contentSnapshot, s);
      const lagLevel = lagMap.get(s.uuid) ?? 'on_track';

      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch (err) {
        this.handleError(err);
      }

      rows.push({ student: s, name, progress, lagLevel });
    }

    // Сортировка: 🛑 → ⚠️ → 🏃 по прогрессу → ✅
    const lagOrder: Record<string, number> = {
      critical: 0,
      lagging: 1,
      on_track: 2,
    };

    rows.sort((a, b) => {
      const la = lagOrder[a.lagLevel] ?? 3;
      const lb = lagOrder[b.lagLevel] ?? 3;
      if (la !== lb) return la - lb;

      // Завершённые (advanced/not_advanced/abandoned) — в конец
      const aDone =
        a.student.status !== 'active' && a.student.status !== 'enrolled';
      const bDone =
        b.student.status !== 'active' && b.student.status !== 'enrolled';
      if (aDone !== bDone) return aDone ? 1 : -1;

      // По убыванию прогресса
      return b.progress.percent - a.progress.percent;
    });

    // Статистика
    let activeCount = 0;
    let advancedCount = 0;
    let notAdvancedCount = 0;
    let abandonedCount = 0;

    for (const r of rows) {
      if (r.student.status === 'active' || r.student.status === 'enrolled') {
        activeCount++;
      } else if (r.student.status === 'advanced') {
        advancedCount++;
      } else if (r.student.status === 'not_advanced') {
        notAdvancedCount++;
      } else if (r.student.status === 'abandoned') {
        abandonedCount++;
      }
    }

    // Клавиатура
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [];

    const { lagMarker } = this.#helpers;
    const canManage = StudentPolicy.canManageStudent(actor, stream);

    // Строки студентов для текста сообщения
    const studentLines: string[] = [];

    for (const r of rows) {
      const marker = lagMarker(r.lagLevel, r.student.status);
      const isActive = r.student.status === 'active';

      // Сводка через DS
      const summary = StreamDs.computeStudentRowSummary(
        stream.contentSnapshot,
        r.student,
      );

      // Текст: маркер, имя, прогресс-бар, категория времени
      const bar = this.#formatProgressBar(
        summary.progress.completed,
        summary.progress.total,
      );
      const parts = [
        `${marker} ${this.escapeMarkdown(r.name)}`,
        `${bar} ${summary.progress.percent}%`,
      ];
      if (summary.dominantCategory && summary.medianTimeMinutes !== null) {
        parts.push(
          `${summary.dominantCategory.emoji} ${summary.dominantCategory.name}: ${summary.medianTimeMinutes} мин`,
        );
      }
      studentLines.push(parts.join(' \\| '));

      // Кнопка: только эмодзи + имя + процент
      const nameBtn = `${marker} ${r.name} — ${summary.progress.percent}%`;

      const studentRow: Array<{ text: string; code: string }> = [
        {
          text: nameBtn,
          code: this.cbFor('monitor', 'detail', r.student.uuid),
        },
      ];

      if (isActive && canManage) {
        studentRow.push({
          text: '⛔',
          code: this.cbFor('monitor', 'mark-abandoned', r.student.uuid),
        });
        studentRow.push({
          text: '✅',
          code: this.cbFor('monitor', 'complete', r.student.uuid),
        });
      } else if (
        canManage &&
        (r.student.status === 'advanced' || r.student.status === 'not_advanced')
      ) {
        studentRow.push({
          text: '🔄',
          code: this.cbFor('monitor', 'complete', r.student.uuid),
        });
      }

      keyboardRows.push(studentRow);
    }

    keyboardRows.push([
      { text: '⬅️ Назад к потоку', code: `view-stream:view:${streamId}` },
    ]);

    // Текст сводки
    const countLabel = this.#pluralize(
      students.length,
      'студент',
      'студента',
      'студентов',
    );

    const header = [
      `👥 *Студенты потока* — _${this.escapeMarkdown(stream.title)}_`,
      '',
      `Всего: ${students.length} ${countLabel}`,
    ];

    // Метрики группы (с заголовком)
    const metrics: string[] = [];
    if (activeCount > 0) metrics.push(`🏃 В процессе: ${activeCount}`);
    if (advancedCount > 0) metrics.push(`✅ Прошли: ${advancedCount}`);
    if (notAdvancedCount > 0) metrics.push(`↩️ Не прошли: ${notAdvancedCount}`);
    if (abandonedCount > 0) metrics.push(`🚫 Выбыли: ${abandonedCount}`);

    header.push('', '———');

    if (metrics.length > 0) {
      header.push('', '*Метрики группы:*', ...metrics);
    }

    header.push(
      '',
      '*Легенда:*',
      '🏃 учится   ✅ прошёл   ↩️ не прошёл   🚫 выбыл',
      '',
      '———',
      '',
      '*Метрики по студентам:*',
    );

    // Добавляем строки студентов в текст
    for (const line of studentLines) {
      header.push(line);
    }

    header.push('');
    header.push('*Легенда:*');
    header.push('🛑 критическое отставание, кандидат на отчисление');
    header.push('⚠️ учится, но отстаёт от группы');
    header.push('🏃 в норме, учится');
    header.push('🚫 забросил учебу');
    header.push('↩️ завершил модуль, но пройдет заново');
    header.push('✅ завершил модуль, проходит дальше');

    return {
      sendMessage: {
        text: header.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  /** Хелперы форматирования */
  get #helpers() {
    return {
      /** Возвращает маркер отставания с учётом статуса */
      lagMarker: (
        lagLevel: CategorizedStudent['lagLevel'],
        status: string,
      ): string => {
        if (status === 'advanced') return '✅';
        if (status === 'not_advanced') return '↩️';
        if (status === 'abandoned') return '🚫';
        if (lagLevel === 'critical') return '🛑';
        if (lagLevel === 'lagging') return '⚠️';
        return '🏃';
      },
    };
  }

  /**
   * Форматирует прогресс-бар для Telegram MarkdownV2.
   * Скобки экранированы: \[ ████░░░░ \]
   */
  #formatProgressBar(completed: number, total: number): string {
    const width = 10;
    const filled = total === 0 ? 0 : Math.round((completed / total) * width);
    const empty = width - filled;
    return `\\[${'█'.repeat(filled)}${'░'.repeat(empty)}\\] ${completed}/${total}`;
  }

  /** Склоняет существительное: 1 студент, 2 студента, 5 студентов */
  #pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  async #handleDetail(studentId: string, actor: User): Promise<BotResponse> {
    const student: Student = await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch (err) {
      this.handleError(err);
    }

    const stream = await this.appApi.execute('get-stream', {
      streamId: student.streamId,
    });

    if (!stream) {
      return { sendMessage: { text: '⚠️ Поток не найден' } };
    }

    // Lag info
    const [cat] = StreamDs.categorizeStudents([student]);
    const lagInfo = cat
      ? {
          lagLevel: cat.lagLevel,
          hoursSinceLastActivity: cat.hoursSinceLastActivity,
        }
      : { lagLevel: 'on_track' as const, hoursSinceLastActivity: 0 };

    // Карточка через DS (только данные)
    const card = StreamDs.computeStudentCard(
      stream.contentSnapshot,
      student,
      lagInfo,
    );

    const statusLabels: Record<string, string> = {
      active: '🟢 Учится',
      abandoned: '🚫 Выбыл',
      advanced: '✅ Прошёл',
      not_advanced: '↩️ Не прошёл',
    };

    const esc = (s: string) => this.escapeMarkdown(s);
    const bar = (c: number, t: number) => this.#formatProgressBar(c, t);

    const lines = [
      `👤 *${esc(userName)}* \\| ${statusLabels[student.status] ?? student.status}`,
      '',
      '———',
      '',
      '*Прогресс студента:*',
      `📊 Прогресс по модулю: ${bar(card.moduleProgress.completed, card.moduleProgress.total)} \\| ${card.moduleProgress.percent}%`,
    ];

    // Проект и урок
    if (card.currentProject) {
      lines.push('', `📁 Проект: «${esc(card.currentProject.title)}»`);
      if (card.currentLesson) {
        lines.push(`📝 Урок: «${esc(card.currentLesson.title)}»`);
      }
      lines.push(
        `📊 Прогресс по проекту: ${bar(card.currentProject.progress.completed, card.currentProject.progress.total)} \\| ${card.currentProject.progress.percent}%`,
      );
    }

    // Усидчивость студента
    lines.push('', '———', '', '*Усидчивость студента:*');

    // Среднее время
    if (card.medianTimeMinutes !== null) {
      lines.push(
        '',
        `⏱ Типичное время на шаг: ${card.medianTimeMinutes} мин\\.`,
      );
    }

    // Категории времени с описаниями (каждая с новой строки)
    const catDescs: Record<string, string> = {
      Бегун: '< 1 мин\\.',
      Спринтер: '< 5 мин\\.',
      Вдумчивый: '< 15 мин\\.',
      Исследователь: '\\> 15 мин\\.',
    };
    for (const c of card.timeCategories) {
      const desc = catDescs[c.name] ?? '';
      lines.push(
        `${c.emoji} ${c.name} \u005c\u0028${desc}\u005c\u0029: ${c.count} шаг\u005c\u0028ов\u005c\u0029`,
      );
    }
    // Активность студента
    lines.push('', '———', '', '*Активность студента:*');

    // Последняя активность
    const hours = Math.round(card.hoursSinceLastActivity);
    if (hours > 0) {
      const days = Math.round(hours / 24);
      if (days >= 1) {
        lines.push('', `📅 Последняя активность: ${days} дн\\. назад`);
      } else {
        lines.push('', `📅 Последняя активность: ${hours} ч\\. назад`);
      }
    }

    // Отставание / статус
    if (student.status === 'active') {
      if (card.lagLevel === 'critical') {
        const days = Math.round(card.hoursSinceLastActivity / 24);
        lines.push('', `🛑 Критическое отставание: ${days} дн\\.`);
      } else if (card.lagLevel === 'lagging') {
        if (card.hoursSinceLastActivity > 4 * 24) {
          const days = Math.round(card.hoursSinceLastActivity / 24);
          lines.push('', `⚠️ Отстаёт: ${days} дн\\.`);
        } else {
          lines.push('', '⚠️ Отстаёт от группы');
        }
      } else {
        lines.push('', '✅ Идёт по расписанию');
      }
    }

    // Клавиатура: только навигация
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [
      [
        {
          text: '⬅️ Назад к списку',
          code: this.cbFor('monitor', 'students', student.streamId),
        },
      ],
    ];

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  // ── mark-abandoned ──

  async #handleMarkAbandonedConfirm(
    studentId: string,
    actor: User,
  ): Promise<BotResponse> {
    const student: Student = await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    return this.confirm(
      'mark-abandoned',
      studentId,
      `⚠️ Отметить *${this.escapeMarkdown(userName)}* как неактивного?`,
      {
        confirmButton: '⚠️ Да, неактивен',
      },
    );
  }

  async #handleMarkAbandonedExecute(
    studentId: string,
    actor: User,
    _action: string,
  ): Promise<BotResponse> {
    const student: Student = await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    try {
      await this.appApi.execute(
        'mark-abandoned',
        { streamId: student.streamId, studentId, cause: 'inactivity' as const },
        actor.uuid,
      );
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: `✅ Студент *${this.escapeMarkdown(userName)}* отмечен как неактивный\\.`,
        parseMode: 'MarkdownV2',
      },
      delegate: {
        path: this.cbFor('monitor', 'students', student.streamId),
      },
    };
  }

  // ── complete-student (выбор исхода) ──

  async #handleCompleteChoice(studentId: string): Promise<BotResponse> {
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [
      [
        {
          text: '✅ Прошёл',
          code: `${this.cbFor('monitor', 'complete-confirm', studentId)}:advanced`,
        },
      ],
      [
        {
          text: '↩️ Не прошёл',
          code:
            this.cbFor('monitor', 'complete-confirm', studentId) +
            ':not_advanced',
        },
      ],
      [
        {
          text: '🔴 Выбыл',
          code: `${this.cbFor('monitor', 'complete-confirm', studentId)}:abandoned`,
        },
      ],
      [
        {
          text: '❌ Отмена',
          code: this.cbFor('monitor', 'detail', studentId),
        },
      ],
    ];

    return {
      sendMessage: {
        text: 'Выберите исход для студента:',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  async #handleCompleteConfirm(
    studentId: string,
    actor: User,
    action: string,
  ): Promise<BotResponse> {
    // action = 'complete-confirm:studentId:outcome'
    const parts = action.split(':');
    const outcome = parts[2]; // advanced | not_advanced | abandoned

    const student: Student = await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    const outcomeLabels: Record<string, string> = {
      advanced: 'прошёл',
      not_advanced: 'не прошёл',
      abandoned: 'выбыл',
    };

    // confirm-диалог использует действие 'complete-confirm' → кнопка подтверждения
    // получает код 'complete-confirm-confirm:studentId:outcome' (см. #handleCompleteExecute).
    // Это развязывает confirm-диалог и выполнение, избегая зацикливания.
    return this.confirm(
      'complete-confirm',
      studentId,
      `Завершить студента *${this.escapeMarkdown(userName)}* с исходом «${outcomeLabels[outcome ?? ''] ?? outcome}»?`,
      {
        confirmButton: '✅ Завершить',
        extraData: outcome,
      },
    );
  }

  async #handleCompleteExecute(
    studentId: string,
    actor: User,
    action: string,
  ): Promise<BotResponse> {
    // action = 'complete-confirm-confirm:studentId:outcome'
    const parts = action.split(':');
    const rawOutcome = parts[2]; // advanced | not_advanced | abandoned
    if (
      rawOutcome !== 'advanced' &&
      rawOutcome !== 'not_advanced' &&
      rawOutcome !== 'abandoned'
    ) {
      return { sendMessage: { text: '⚠️ Неизвестный исход' } };
    }
    const outcome = rawOutcome;

    const student: Student = await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    try {
      await this.appApi.execute(
        'complete-student',
        {
          streamId: student.streamId,
          studentId,
          outcome,
        },
        actor.uuid,
      );
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: `✅ Студент *${this.escapeMarkdown(userName)}* завершён\\.`,
        parseMode: 'MarkdownV2',
      },
      delegate: {
        path: this.cbFor('monitor', 'students', student.streamId),
      },
    };
  }
}
