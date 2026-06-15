# План реализации: Stream UX Backlog

## Фаза 1: Навигация ◀️/▶️ по истории шагов (UX-1)

- [ ] Task: Написать тест: LearningStory показывает кнопку «Назад» и обрабатывает её
  - [ ] Студент с шагами в истории видит кнопку «◀️ Назад»
  - [ ] Нажатие показывает предыдущий шаг без кнопки «Выполнено»
  - [ ] На архивном шаге есть кнопка «▶️ Вперёд»

- [ ] Task: Реализовать навигацию в LearningStory
  - [ ] Добавить callback `learning:back:<studentId>:<streamId>:<stepId>`
  - [ ] Добавить callback `learning:forward:<studentId>:<streamId>:<stepId>`
  - [ ] На архивном шаге скрывать кнопку «Выполнено»

- [ ] Task: Conductor - Ручная верификация 'Навигация по истории'

## Фаза 2: Double-confirm (UX-2)

- [ ] Task: Написать тест: первый клик «Выполнено» меняет кнопку на «Подтвердить»
  - [ ] После первого клика кнопка меняется, complete-step НЕ вызывается
  - [ ] После второго клика вызывается complete-step

- [ ] Task: Реализовать double-confirm в LearningStory
  - [ ] Первый callback: `learning:confirm:<studentId>:<streamId>:<stepId>` — меняет клавиатуру
  - [ ] Второй callback: существующий `learning:complete:...` — выполняет шаг

- [ ] Task: Conductor - Ручная верификация 'Double-confirm'

## Фаза 3: Broadcast при запуске (UX-3)

- [ ] Task: Написать тест: ActivateStreamStory возвращает broadcast-сообщения

- [ ] Task: Реализовать broadcast в ActivateStreamStory
  - [ ] После `activate-stream` получить список студентов (`list-stream-students`)
  - [ ] Для каждого студента получить `telegramId` через `UserFacade`
  - [ ] Вернуть массив `sendMessage` в BotResponse или механизм массовой рассылки

- [ ] Task: Conductor - Ручная верификация 'Broadcast при запуске'

## Фаза 4: Логика «Отстает» (UX-4)

- [ ] Task: Написать тест: MonitorStory помечает отстающих
  - [ ] Студент без активности 6 дней → «⚠️ Отстает»
  - [ ] Студент с прогрессом < медианного на 30% → «⚠️ Отстает»

- [ ] Task: Реализовать логику «Отстает» в MonitorStory
  - [ ] Вычислить медианный прогресс по группе
  - [ ] Проверить `completedAt` последнего шага (если старше 5 дней → отстаёт)
  - [ ] Проверить отставание от медианы на 30%+

- [ ] Task: Conductor - Ручная верификация 'Статус Отстает'

## Фаза 5: Кнопки «Завершить» / «В архив» (UX-5)

- [ ] Task: Написать тест: ViewStreamStory показывает «Завершить» для active и «В архив»

- [ ] Task: Реализовать кнопки ментора
  - [ ] На active: `complete-stream:complete:<streamId>`
  - [ ] Всегда: `activate-stream:archive:<streamId>` (перенести/добавить в ActivateStreamStory)

- [ ] Task: Conductor - Ручная верификация 'Завершение и архивация'
