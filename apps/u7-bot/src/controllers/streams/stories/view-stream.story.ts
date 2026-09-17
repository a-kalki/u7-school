import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type {
  BotSession,
  BotUpdate,
  DialogResponse,
  KbButton,
  KeyboardDescription,
} from '@u7-scl/core/ui';
import type {
  CategorizedStudent,
  Stream,
  Student,
} from '@u7-scl/stream/domain';
import {
  CompletionSign,
  StreamDs,
  StreamPolicy,
  StudentAr,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { TreeNode } from '../../../shared/tree-renderer';
import { renderTree } from '../../../shared/tree-renderer';
import { Routes } from '../../shared/routes';

/** Контекст awaitInput при вводе кодового слова */
interface EnrollKeyContext {
  streamId: string;
  enrollmentKey: string;
  attempts: number;
}

/** Минимум полей потока для финального поздравления */
interface EnrollStreamInfo {
  title: string;
  startDate: string;
  telegramGroupInvite?: string;
}

const MAX_ENROLL_ATTEMPTS = 3;

/**
 * S02-S04: Детальная карточка потока (curious-режим).
 * Показывает описание, статус, дату старта, имя ментора и публичные кнопки.
 */
export class ViewStreamStory extends U7BotUiStory {
  readonly name: string = 'view-stream';

  /** Имя сторис для cbFor. */
  protected storyName = 'view-stream';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, streamId] = action.split(':');

    if (cmd === 'program' && streamId) {
      return this.handleProgramView(streamId);
    }

    if (cmd === 'details' && streamId) {
      return this.handleDetailsView(streamId);
    }

    if (cmd === 'students' && streamId) {
      return this.handleStudentsList(streamId, actor);
    }

    if (cmd === 'student-detail' && streamId) {
      return this.#handleStudentDetail(streamId, actor);
    }

    if (cmd === 'enroll' && streamId) {
      return this.handleEnrollStart(streamId, actor);
    }

    if (cmd === 'cancel' && streamId) {
      return this.handleEnrollCancel(streamId);
    }

    if (cmd !== 'view' || !streamId) {
      return this.unknownCommand(action, actor, session);
    }

    return this.handleView(streamId, actor);
  }

  override async handleMessage(
    update: BotUpdate,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (update.type !== 'message') {
      return this.warn(md`Ожидалось текстовое сообщение\\.`);
    }

    const ctx = session.dialog?.input?.context as EnrollKeyContext | undefined;
    if (!ctx) {
      // Ввод без ожидания — страховочный отказ (диалог не ждёт кодовое слово)
      return {
        ...this.notify(
          md`Извините, на данном этапе сообщения не принимаются\\.`,
        ),
        release: true,
      };
    }

    const enteredKey = update.text;

    if (enteredKey !== ctx.enrollmentKey) {
      const attemptsLeft = MAX_ENROLL_ATTEMPTS - ctx.attempts - 1;
      if (attemptsLeft <= 0) {
        return {
          release: true,
          ...this.screen(
            md`❌ Попытки исчерпаны\\.\nВозврат к потоку — нажмите кнопку ниже\\.`,
            this.kb([
              [
                this.btn(
                  '⬅️ Назад к потоку',
                  this.cbFor(this.storyName, 'view', ctx.streamId),
                ),
              ],
            ]),
          ),
        };
      }

      return {
        ...this.warn(
          md`❌ Неверное слово\\. Осталось попыток: ${attemptsLeft}`,
        ),
        awaitInput: {
          context: {
            ...ctx,
            attempts: ctx.attempts + 1,
          } satisfies EnrollKeyContext,
        },
      };
    }

    // Верное слово — зачисляем
    return this.#doEnroll(ctx.streamId, actor, ctx.enrollmentKey);
  }

  // ── Защищённые методы (доступны для наследования) ──

  protected async handleView(
    streamId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;
    let studentCount = 0;
    try {
      const students = await this.appApi.execute(
        'list-stream-students',
        { streamId },
        actor,
      );
      studentCount = (students as unknown[]).length;
    } catch {
      // счётчик студентов не критичен для карточки
    }

    let mentorName = '';
    try {
      const mentor = await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      });
      mentorName = mentor.name;
    } catch {
      // имя ментора не критично для карточки
    }

    const statusLabels: Record<string, string> = {
      enrollment: '🟡 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '🟢 Завершён',
      archived: '⚫ Архивирован',
    };

    const dateStr = this.formatDate(stream.startDate);
    const timeStr = this.#formatTime(stream.startDate);

    const text = mdJoin([
      md`📋 *${stream.title}*`,
      md``,
      md`_${stream.description}_`,
      md``,
      md`👤 Ментор: ${mentorName}`,
      md`📅 Старт: ${dateStr}`,
      md`🕐 Время: ${timeStr}`,
      md`👥 Студентов: ${studentCount}`,
      md`📌 Статус: ${statusLabels[stream.status] ?? stream.status}`,
      md`📚 Курс: Fullstack JS`,
    ]);

    const keyboard = this.buildKeyboard(stream, actor);

    return this.screen(text, keyboard.rows.length > 0 ? keyboard : undefined);
  }

  protected async handleProgramView(streamId: string): Promise<DialogResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;
    const snapshot = stream.contentSnapshot;

    if (!snapshot || snapshot.length === 0) {
      return this.screen(
        md`📖 *Программа курса*\n\nПрограмма пока не загружена\\.`,
        this.kb([
          [
            this.btn(
              '⬅️ Назад к потоку',
              this.cbFor(this.storyName, 'view', streamId),
            ),
          ],
        ]),
      );
    }

    // Собираем дерево проектов для tree-renderer.
    // Контракт TreeNode.title — «уже экранированный для MarkdownV2»,
    // поэтому заголовки пропускаем через md-интерполяцию ДО renderTree.
    const projectNodes: TreeNode[] = snapshot.map(
      (p: {
        projectTitle: string;
        lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
      }) => ({
        // префиксы «Проект:»/«Урок:» — как в каталоге «Программы курсов»
        title: md`Проект: ${p.projectTitle}`,
        emoji: '📁',
        children: p.lessons.map(
          (l: { lessonTitle: string; stepIds: string[] }) =>
            ({
              title: md`Урок: ${l.lessonTitle}`,
              emoji: '📝',
              meta: `${l.stepIds.length} шаг${this.#plural(l.stepIds.length, '', 'а', 'ов')}`,
            }) as TreeNode,
        ),
      }),
    );

    const treeText = renderTree(projectNodes);
    const text = mdConcat(md`📖 *Программа курса*\n\n`, mdRaw(treeText));

    return this.screen(
      this.#truncate(text),
      this.kb([
        [
          this.btn(
            '⬅️ Назад к потоку',
            this.cbFor(this.storyName, 'view', streamId),
          ),
        ],
      ]),
    );
  }

  protected async handleDetailsView(streamId: string): Promise<DialogResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;

    const fields: Array<{ label: string; value: string | undefined }> = [
      { label: '🎯 Цель', value: stream.goal },
      { label: '🏆 Результат', value: stream.result },
      { label: '📜 Правила', value: stream.rules },
      { label: '👤 Целевая аудитория', value: stream.targetAudience },
      { label: '📝 Дополнительно', value: stream.additional },
    ];

    const filled = fields.filter((f) => f.value);

    const lines: MdText[] = [md`📋 *Детали: ${stream.title}*`, md``];

    if (filled.length > 0) {
      for (const f of filled) {
        lines.push(md`${f.label}: ${f.value ?? ''}`);
      }
    } else {
      lines.push(md`_Расширенная информация пока не добавлена\\._`);
    }

    return this.screen(
      mdJoin(lines),
      this.kb([
        [
          this.btn(
            '⬅️ Назад к потоку',
            this.cbFor(this.storyName, 'view', streamId),
          ),
        ],
      ]),
    );
  }

  protected buildKeyboard(stream: Stream, actor: User): KeyboardDescription {
    const canEnroll = StreamPolicy.canEnroll(actor);
    const isOwnerMentor = StreamPolicy.canEdit(actor, stream);
    const rows: KbButton[][] = [];

    // ── Публичные кнопки (всем) ──

    // Информационные кнопки о курсе — рядом, первой строкой
    rows.push([
      this.btn(
        '📖 Программа курса',
        this.cbFor(this.storyName, 'program', stream.uuid),
      ),
      this.btn('📋 Детали', this.cbFor(this.storyName, 'details', stream.uuid)),
    ]);

    // Кнопка «👥 Студенты» — свой обработчик
    rows.push([
      this.btn(
        '👥 Студенты',
        this.cbFor(this.storyName, 'students', stream.uuid),
      ),
    ]);

    // ── Гостевые кнопки ──
    if (!isOwnerMentor) {
      if (stream.status === 'enrollment' && canEnroll) {
        rows.push([
          this.btn(
            '📝 Записаться',
            this.cbFor(this.storyName, 'enroll', stream.uuid),
          ),
        ]);
      }
    }

    // Кнопка «⬅️ Назад к списку» — возврат в каталог
    rows.push([this.btn('⬅️ Назад к списку', this.cbFor('catalog', 'list'))]);

    return this.kb(rows);
  }

  // ── Обработчик «👥 Студенты» ──

  protected async handleStudentsList(
    streamId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const students = (await this.appApi.execute(
      'list-stream-students',
      { streamId },
      actor,
    )) as Student[];

    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;

    if (!stream) {
      return this.screen(md`⚠️ Поток не найден`);
    }

    // Категоризируем через DS
    const categorized = StreamDs.categorizeStudents(students, new Date());
    const lagMap = new Map(categorized.map((c) => [c.studentId, c.lagLevel]));

    interface StudentRow {
      student: Student;
      ar: StudentAr;
      name: string;
      progress: { completed: number; total: number; percent: number };
      lagLevel: CategorizedStudent['lagLevel'];
    }

    const rows: StudentRow[] = [];
    for (const s of students) {
      const progress = StreamDs.computeProgress(stream.contentSnapshot, s);
      const lagLevel = lagMap.get(s.uuid) ?? 'on_track';
      const ar = new StudentAr(s);

      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch {
        // оставляем обрезок userId
      }

      rows.push({ student: s, ar, name, progress, lagLevel });
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

      const aDone =
        a.ar.outcomeCategory() !== StudentOutcomeCategory.IN_PROGRESS;
      const bDone =
        b.ar.outcomeCategory() !== StudentOutcomeCategory.IN_PROGRESS;
      if (aDone !== bDone) return aDone ? 1 : -1;

      return b.progress.percent - a.progress.percent;
    });

    // Статистика
    let activeCount = 0;
    let advancedCount = 0;
    let notAdvancedCount = 0;
    let abandonedCount = 0;

    for (const r of rows) {
      const category = r.ar.outcomeCategory();
      if (category === StudentOutcomeCategory.IN_PROGRESS) {
        activeCount++;
      } else if (category === StudentOutcomeCategory.ABANDONED) {
        abandonedCount++;
      } else if (r.ar.outcomeSigns().includes(CompletionSign.PASSED)) {
        advancedCount++;
      } else {
        notAdvancedCount++;
      }
    }

    const keyboardRows: KbButton[][] = [];

    // Строки студентов для текста
    const studentLines: MdText[] = [];

    for (const r of rows) {
      const marker = this.#lagMarker(r.lagLevel, r.ar);

      const summary = StreamDs.computeStudentRowSummary(
        stream.contentSnapshot,
        r.student,
      );

      const bar = this.#formatProgressBar(
        summary.progress.completed,
        summary.progress.total,
      );
      const lineParts: MdText[] = [
        md`${marker} ${r.name}`,
        mdConcat(bar, md` ${summary.progress.percent}%`),
      ];
      if (summary.dominantCategory && summary.medianTimeMinutes !== null) {
        lineParts.push(
          mdConcat(
            md`${summary.dominantCategory.emoji} ${summary.dominantCategory.name}: `,
            md`${summary.medianTimeMinutes}`,
            md` мин`,
          ),
        );
      }
      studentLines.push(mdJoin(lineParts, ' \\| '));

      const nameBtn = `${marker} ${r.name} — ${summary.progress.percent}%`;

      // Публичный режим: только кнопка-имя, ведёт в student-detail
      keyboardRows.push([
        this.btn(
          nameBtn,
          this.cbFor(this.storyName, 'student-detail', r.student.uuid),
        ),
      ]);
    }

    keyboardRows.push([
      this.btn(
        '⬅️ Назад к потоку',
        this.cbFor(this.storyName, 'view', streamId),
      ),
    ]);

    const countLabel = this.#pluralize(
      students.length,
      'студент',
      'студента',
      'студентов',
    );

    const header: MdText[] = [
      md`👥 *Студенты потока* — _${stream.title}_`,
      md``,
      md`Всего: ${students.length} ${countLabel}`,
    ];

    const metrics: string[] = [];
    if (activeCount > 0) metrics.push(`🏃 В процессе: ${activeCount}`);
    if (advancedCount > 0) metrics.push(`✅ Прошли: ${advancedCount}`);
    if (notAdvancedCount > 0) metrics.push(`↩️ Не прошли: ${notAdvancedCount}`);
    if (abandonedCount > 0) metrics.push(`🚫 Выбыли: ${abandonedCount}`);

    header.push(md``, md`———`);

    if (metrics.length > 0) {
      header.push(md``, md`*Метрики группы:*`);
      for (const m of metrics) {
        header.push(mdRaw(m));
      }
    }

    header.push(
      md``,
      md`*Легенда:*`,
      md`🏃 учится   ✅ прошёл   ↩️ не прошёл   🚫 выбыл`,
      md``,
      md`———`,
      md``,
      md`*Метрики по студентам:*`,
      ...studentLines,
      md``,
      md`*Легенда:*`,
      md`🛑 критическое отставание, кандидат на снятие с учёбы`,
      md`⚠️ учится, но отстаёт от группы`,
      md`🏃 в норме, учится`,
      md`🚫 выбыл из учёбы`,
      md`↩️ завершил модуль, но пройдет заново`,
      md`✅ завершил модуль, проходит дальше`,
    );

    return this.screen(mdJoin(header), this.kb(keyboardRows));
  }

  /**
   * Публичная карточка студента — полные метрики без менторских действий.
   * Вызывается из handleStudentsList при нажатии на имя студента.
   * Показывает: Прогресс студента, Усидчивость студента, Активность студента.
   */
  async #handleStudentDetail(
    studentId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const student = (await this.appApi.execute(
      'get-student-progress',
      { studentId },
      actor,
    )) as Student;

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // оставляем обрезок
    }

    const stream = (await this.appApi.execute('get-stream', {
      streamId: student.streamId,
    })) as Stream;

    if (!stream) {
      return this.screen(md`⚠️ Поток не найден`);
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

    const bar = (c: number, t: number) => this.#formatProgressBar(c, t);
    const ar = new StudentAr(student);

    const lines: MdText[] = [
      mdConcat(
        md`👤 *${userName}* \\| `,
        md`${this.#statusIcon(ar)} ${ar.outcomeLabel()}`,
      ),
      md``,
      md`———`,
      md``,
      md`*Прогресс студента:*`,
      mdConcat(
        mdRaw(
          `📊 Прогресс по модулю: ${bar(card.moduleProgress.completed, card.moduleProgress.total)} \\| `,
        ),
        md`${card.moduleProgress.percent}%`,
      ),
    ];

    // Проект и урок
    if (card.currentProject) {
      lines.push(md``, md`📁 Проект: «${card.currentProject.title}»`);
      if (card.currentLesson) {
        lines.push(md`📝 Урок: «${card.currentLesson.title}»`);
      }
      lines.push(
        mdConcat(
          mdRaw(
            `📊 Прогресс по проекту: ${bar(card.currentProject.progress.completed, card.currentProject.progress.total)} \\| `,
          ),
          md`${card.currentProject.progress.percent}%`,
        ),
      );
    }

    // Усидчивость студента
    lines.push(md``, md`———`, md``, md`*Усидчивость студента:*`);

    // Среднее время
    if (card.medianTimeMinutes !== null) {
      lines.push(
        md``,
        md`⏱ Типичное время на шаг: ${card.medianTimeMinutes} мин\\.`,
      );
    }

    // Категории времени с описаниями
    const catDescs: Record<string, string> = {
      Бегун: '< 1 мин\\.',
      Спринтер: '< 5 мин\\.',
      Вдумчивый: '< 15 мин\\.',
      Исследователь: '\\> 15 мин\\.',
    };
    for (const c of card.timeCategories) {
      const desc = catDescs[c.name] ?? '';
      lines.push(
        mdConcat(
          md`${c.emoji} ${c.name} `,
          mdRaw(`\\(${desc}\\)`),
          md`: ${c.count} шаг\\(ов\\)`,
        ),
      );
    }

    // Активность студента
    lines.push(md``, md`———`, md``, md`*Активность студента:*`);

    // Последняя активность
    const hours = Math.round(card.hoursSinceLastActivity);
    if (hours > 0) {
      const days = Math.round(hours / 24);
      if (days >= 1) {
        lines.push(md``, md`📅 Последняя активность: ${days} дн\\. назад`);
      } else {
        lines.push(md``, md`📅 Последняя активность: ${hours} ч\\. назад`);
      }
    }

    // Отставание / статус
    if (student.status === 'active') {
      if (card.lagLevel === 'critical') {
        const days = Math.round(card.hoursSinceLastActivity / 24);
        lines.push(md``, md`🛑 Критическое отставание: ${days} дн\\.`);
      } else if (card.lagLevel === 'lagging') {
        if (card.hoursSinceLastActivity > 4 * 24) {
          const days = Math.round(card.hoursSinceLastActivity / 24);
          lines.push(md``, md`⚠️ Отстаёт: ${days} дн\\.`);
        } else {
          lines.push(md``, md`⚠️ Отстаёт от группы`);
        }
      } else {
        lines.push(md``, md`✅ Идёт по расписанию`);
      }
    }

    // Клавиатура: только навигация
    const keyboardRows: KbButton[][] = [
      [
        this.btn(
          '⬅️ Назад к списку',
          this.cbFor(this.storyName, 'students', student.streamId),
        ),
      ],
    ];

    return this.screen(mdJoin(lines), this.kb(keyboardRows));
  }

  /** Иконка исхода студента (оформление; тексты — из словаря агрегата) */
  #statusIcon(ar: StudentAr): string {
    switch (ar.outcomeCategory()) {
      case StudentOutcomeCategory.COMPLETED:
        return ar.outcomeSigns().includes(CompletionSign.PASSED) ? '✅' : '↩️';
      case StudentOutcomeCategory.ABANDONED:
        return '🚫';
      case StudentOutcomeCategory.IN_PROGRESS:
        return '🟢';
    }
  }

  /** Возвращает маркер отставания с учётом исхода студента */
  #lagMarker(lagLevel: CategorizedStudent['lagLevel'], ar: StudentAr): string {
    if (ar.outcomeCategory() !== StudentOutcomeCategory.IN_PROGRESS) {
      return this.#statusIcon(ar);
    }
    if (lagLevel === 'critical') return '🛑';
    if (lagLevel === 'lagging') return '⚠️';
    return '🏃';
  }

  /**
   * Форматирует прогресс-бар для Telegram MarkdownV2.
   * Скобки экранированы: \[ ████░░░░ \]
   * Возвращает уже размеченный текст (mdRaw — экранирование внутри).
   */
  #formatProgressBar(completed: number, total: number): MdText {
    const width = 10;
    const filled = total === 0 ? 0 : Math.round((completed / total) * width);
    const empty = width - filled;
    return mdRaw(
      `\\[${'█'.repeat(filled)}${'░'.repeat(empty)}\\] ${completed}/${total}`,
    );
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

  // ── Обработчики «📝 Записаться» ──

  protected async handleEnrollStart(
    streamId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as { enrollmentKey?: string; title: string };

    // Если есть кодовое слово — запрашиваем его
    if (stream.enrollmentKey) {
      return this.ask(
        md`🔑 Введите кодовое слово для записи на поток:`,
        {
          streamId,
          enrollmentKey: stream.enrollmentKey,
          attempts: 0,
        } satisfies EnrollKeyContext,
        this.kb([
          [
            this.btn(
              '❌ Отмена',
              this.cbFor(this.storyName, 'cancel', streamId),
            ),
          ],
        ]),
      );
    }

    // Без кодового слова — сразу зачисляем
    return this.#doEnroll(streamId, actor);
  }

  protected async handleEnrollCancel(
    streamId: string,
  ): Promise<DialogResponse> {
    return {
      release: true,
      ...this.go(this.cbFor(this.storyName, 'view', streamId)),
    };
  }

  async #doEnroll(
    streamId: string,
    actor: User,
    enrollmentKey?: string,
  ): Promise<DialogResponse> {
    let stream: EnrollStreamInfo;
    try {
      stream = (await this.appApi.execute('get-stream', {
        streamId,
      })) as EnrollStreamInfo;
    } catch (err) {
      return this.errorNotify(err);
    }

    try {
      await this.appApi.execute(
        'enroll-student',
        {
          streamId,
          userId: actor.uuid,
          enrollmentKey,
        },
        actor,
      );
    } catch (err) {
      // Ошибки валидации/конфликты — реплика-переспрос без захвата экрана
      return this.errorNotify(err);
    }

    const dateStr = this.formatDate(stream.startDate);
    const lines: MdText[] = [
      md`🎉 *Вы успешно записаны на поток\\!*`,
      md``,
      md`📋 _${stream.title}_`,
      md`📅 Обучение начнётся: ${dateStr}`,
      md``,
      md`Теперь вы можете получить функционал по учёбе, набрав /start и перейдя по кнопке «Моя учёба»`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push(md``, md`🔗 ${stream.telegramGroupInvite}`);
    }

    return {
      ...this.notify(mdJoin(lines)),
      delegate: { path: Routes.app.mainMenu },
    };
  }

  #formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${min}`;
    } catch {
      return iso;
    }
  }

  #plural(count: number, one: string, two: string, five: string): string {
    const n = count % 100;
    if (n >= 11 && n <= 19) return five;
    const r = n % 10;
    if (r === 1) return one;
    if (r >= 2 && r <= 4) return two;
    return five;
  }

  #truncate(text: MdText, maxLen = 4000): MdText {
    if (text.length <= maxLen) return text;
    return mdConcat(mdRaw(text.slice(0, maxLen - 15)), md`${'...'}`);
  }
}
