# Инвентаризация кнопок/реплик mentor-стори (протокол «миграция без потери функциональности»)

> Источники: код 6 сторей (`apps/u7-bot/src/controllers/mentor/stories/`), старые юнит-тесты,
> `ui-spec.md` (S07/S08). Спека покрывает только monitor (S07/S08); остальные экраны в спеке
> не описаны — это пробел, а не расхождение; закрывается в Фазе 3 (полная сверка).
> Коды в таблицах — как их строит стори (`story:action[:id]`, без префикса контроллера).

## S02m — submenu («🛠️ Инструменты ментора»)

- **Вход в меню:** `menuButtons` — MENTOR/ADMIN: `{kind:'callback', text:'🛠️ Инструменты ментора', action:'submenu:start', priority:30, description}`; GUEST/STUDENT — нет.
- Экран «start»: «🛠️ Инструменты ментора»; кнопки:
  | Текст | Код |
  |---|---|
  | 📋 Мои потоки | `my-streams:list` |
  | ➕ Создать поток | `create-stream:start` |
  | 🔙 Назад | `app:main-menu` |
- Реплики: не-ментор → экран «⚠️ У вас нет доступа к инструментам ментора.»; неизвестный action → экран «⚠️ Неизвестная команда»; ввод текста — дефолт ядра (реплика-отказ + release; старый override «Используйте кнопки меню…» заменяется дефолтом).

## my-streams («📋 Мои потоки»)

- Экран «list[:completed:1][:archived:1]»: «📋 Мои потоки» + легенда 🟡/🔵/🟢/⚫.
- Потоки: свои (`mentorId === actor.uuid`); дефолт — только enrollment+active.
- Кнопки потоков: `{эмодзи} {title}` → `view-stream-mentor:view:{uuid}`.
- Переключатели (4 состояния): дефолт → `⚫ Вкл. архивированные`=`list:archived:1`, `🟢 Вкл. завершённые`=`list:completed:1`; один включён → второй переключатель = `list:completed:1:archived:1`; оба — переключателей нет.
- «🔙 Назад» → `submenu:start` (всегда, включая пустой список).
- Пустой: «У вас пока нет потоков\.»; ошибка API: экран «⚠️ Не удалось загрузить список потоков.»; ввод — дефолт ядра.

## view-stream-mentor (S09-подобный, наследует ViewStreamStory)

- view: карточка (текст родителя) + клавиатура:
  | Текст | Код | Условие |
  |---|---|---|
  | 📖 Программа курса | `view-stream-mentor:program:{id}` | всегда |
  | 👥 Студенты | `monitor:students:{id}` | всегда |
  | 📋 Детали | `view-stream-mentor:details:{id}` | всегда |
  | 🚀 Запустить | `activate-stream:activate:{id}` | enrollment + canEdit |
  | ✅ Завершить | `view-stream-mentor:complete:{id}` | active + canEdit |
  | 📁 В архив | `view-stream-mentor:archive:{id}` | completed + canEdit |
  | ⬅️ Назад к моим потокам | `my-streams:list` | всегда |
- program/details: тексты родителя, «⬅️ Назад к потоку» → `view-stream-mentor:view:{id}`.
- students (override `handleStudentsList`): текст родителя; кнопка студента → `monitor:detail:{uuid}`; +`⛔`=`monitor:mark-abandoned:{uuid}`, `✅`=`monitor:complete:{uuid}` для active/enrolled; `🔄`=`monitor:complete:{uuid}` для advanced/not_advanced; всё — только canManage; «⬅️ Назад к потоку» → `view-stream-mentor:view:{id}`.
- complete → confirm: «⚠️ Завершить поток?…»; `✅ Да, завершить`=`view-stream-mentor:complete-confirm:{id}`, `❌ Отмена`=`view-stream-mentor:view:{id}`.
- complete-confirm: UC `complete-stream` → «✅ Поток завершён!» + `⬅️ Назад к списку`=`my-streams:list`.
- archive → confirm: «⚠️ Отправить поток в архив?…»; `✅ Да, в архив`=`view-stream-mentor:archive-confirm:{id}`; выполнение: UC `archive-stream` → «📁 Поток перемещён в архив.» + `⬅️ Назад к списку`=`my-streams:list`.
- Ввод текста — дефолт ядра (awaitInput стори не делает).

## create-stream (US-6, wizard 0–12)

- Шаг 0 «start»: «📦 Выберите модуль курса:»; кнопка модуля `{title}` → `create-stream:module:{uuid}`; нет модулей → «Нет доступных модулей» + `🔄 Обновить список`=`create-stream:start`; ожидание ввода (awaitInput, ctx step 0).
- Шаг 1 «module:{id}»: «📝 Введите название потока:» + «_По умолчанию: «{module.title}»_» + `✅ Принять`=`create-stream:accept-title` (если title есть); ctx step 1, moduleId, title/module* из модуля.
- Шаг 2: «📄 Введите описание потока:» + default + `✅ Принять`=`create-stream:accept-description`; кнопка/ввод → шаг 3.
- Шаг 3: «📅 Введите дату старта…`YYYY\-MM\-DD`…» → `startDate` (без T → `T00:00`) → шаг 4.
- Шаги 4–8 (Цель/Результат/Правила/Целевая аудитория/Дополнительно): «📝 *{Label}*» + default + `✅ Принять`=`create-stream:accept-{field}` (если значение модуля есть) + `⏭️ Пропустить`=`create-stream:skip-{field}`; accept → значение модуля, skip → '', ввод → значение ввода; после additional → шаг 9.
- Шаг 9: «🔗 Введите ID или username Telegram\-группы…(необязательно):» + `⏭️ Пропустить`=`create-stream:skip-group`; → шаг 10.
- Шаг 10: «🔗 Введите инвайт\-ссылку на группу потока…(необязательно):» + `⏭️ Пропустить`=`create-stream:skip-invite`; → шаг 11.
- Шаг 11: «🔑 Введите кодовое слово…(необязательно). Оставьте пустым для свободной записи.» + `⏭️ Пропустить`=`create-stream:skip-key`; → шаг 12.
- Шаг 12 превью: «📋 Превью потока» + все заполненные поля + «Всё верно?»; `✅ Создать`=`create-stream:confirm`, `⬅️ Изменить`=`create-stream:start`; ввод текста — переспрос «👆 Используйте кнопки выше…».
- confirm: UC `create-stream` (mentorId=actor, telegramGroupId+telegramGroupInvite+необязательные поля) → «✅ Поток успешно создан!» + release; ошибка → экран handleError.
- `/cancel` (override handleCommand): активна → `stop` с репликой «🚫 Создание потока отменено» + release; неактивна → pass. (handleTimeout удаляется из контракта — §7.)
- Потеря контекста (confirm/accept/skip/ввод без ctx) — реплика-предупреждение + release (ввод не держится мёртвым).
- Не-message update — переспрос «Ожидалось текстовое сообщение»; неизвестный шаг — «Неизвестный шаг»; неизвестная кнопка — «⚠️ Неизвестная команда».

## activate-stream (US-7)

- `activate:{id}`: UC `activate-stream` → «🚀 Поток запущен!…» + `⬅️ Назад к потоку`=`view-stream-mentor:view:{id}`.
- Иное — экран «⚠️ Неизвестная команда»; ввод — дефолт ядра.

## monitor (S07/S08 — по ui-spec.md, источник истины; delegate monitor→students)

- `students:{streamId}` / `students-all:{streamId}` (FR-8): сводка «Всего: N …, из них M активных, P выбывших» всегда по всем; метрики — по видимым; текст: маркеры 🛑⚠️🏃✅↩️🚫, прогресс-бар, категория времени; сортировка 🛑→⚠️→🏃↓прогресс→завершённые в конец.
- Кнопки (S07): строка студента `{Маркер} {Имя} — N%` → `monitor:detail:{uuid}`; active+canManage: `⛔`=`monitor:mark-abandoned:{uuid}`, `✅`=`monitor:complete:{uuid}`; advanced/not_advanced+canManage: `🔄`=`monitor:complete:{uuid}` (оба режима); `👁 Показать выбывших`=`monitor:students-all:{streamId}` / `🙈 Скрыть выбывших`=`monitor:students:{streamId}`; `⬅️ Назад к потоку`=`view-stream-mentor:view:{streamId}`.
- `detail:{id}` (S08): три секции (Прогресс/Усидчивость/Активность), StatusLabel; `⬅️ Назад к списку`=`monitor:students:{streamId}`; действий в S08 нет.
- `history:{id}` — заглушка «🚧 История шагов ещё не реализована, но скоро будет.»
- `mark-abandoned:{id}`: confirm «⚠️ Снять студента *{name}* с учёбы за бездействие?»; `⚠️ Да, неактивен`=`monitor:mark-abandoned-confirm:{id}`; `❌ Отмена`=`monitor:detail:{id}` (дефолт cancelCode).
- `mark-abandoned-confirm:{id}`: UC `mark-abandoned` `{streamId, studentId, cause:'inactivity'}` (FR-5) → «✅ Студент *{name}* снят с учёбы.» + **delegate** → `monitor:students:{streamId}`; ошибка → экран ошибки.
- `complete:{id}`: выбор исхода `✅ Прошёл`/`↩️ Не прошёл`/`🔴 Выбыл` → `monitor:complete-confirm:{id}:{advanced|not_advanced|abandoned}`; `❌ Отмена`=`monitor:detail:{id}`.
- `complete-confirm:{id}:{outcome}`: confirm «Завершить студента *{name}* с исходом «{label}»?»; `✅ Завершить`=`monitor:complete-confirm-confirm:{id}:{outcome}`; `❌ Отмена`=`monitor:detail:{id}`.
- `complete-confirm-confirm:{id}:{outcome}`: UC `complete-student` → «✅ Студент *{name}* завершён.» + **delegate** → `monitor:students:{streamId}`; неизвестный outcome → «⚠️ Неизвестный исход»; ошибка → экран ошибки.
- Ошибка get-user → имя = обрезок userId, список не ломается; поток не найден → «⚠️ Поток не найден»; неизвестное — «⚠️ Неизвестная команда»; ввод — дефолт ядра.

## Задача 3 — «⚠️ Снять с учёбы» из monitor без проактива

Точка входа: карточка студента S08 → «⬅️ Назад к списку» → S07 → `⛔` → confirm → UC `mark-abandoned`
(cause=inactivity, FR-5). Приёмка (после Green): сценарий снятия проходит из monitor; реплика
«✅ Студент … снят с учёбы.» доставлена; delegate возвращает ментора к списку. Кик из TG-группы (FR-6)
и реплика студенту — в UC/event-цепочке (`student.abandoned` → InactivityStory), вне стори.

## InactivityStory — восстановление кнопок через invite (задача 6, прежний UX из 7034c7e~1)

- Warning студенту (5+ дней): текст «⏳ Учёба стоит…» + `🚪 Покинуть учёбу`=`streams:inactivity:drop-student:{studentId}`; канал `invite` (штамп эпохи получателя / якорь app/invite).
- Candidate ментору (7+ дней): текст «🛑 Кандидат на снятие с учёбы…» (+строка wasWarned) + `⚠️ Снять с учёбы`=`streams:inactivity:mark-abandoned:{studentId}`.
- Callback-ветки (восстановить на DialogResponse): drop-student → confirm «Покинуть учёбу?…» (`🚪 Да, покинуть`/`❌ Остаться`→app mainMenu) → UC drop-student → «Ты покинул учёбу…» + `⬅️ В меню`; mark-abandoned → confirm «Снять студента *{name}* с учёбы за бездействие?…» (`⚠️ Да, снять с учёбы`/`❌ Отмена`) → UC mark-abandoned(cause=inactivity) → «✅ Студент *{name}* снят с учёбы за бездействие и исключён из группы потока.»
