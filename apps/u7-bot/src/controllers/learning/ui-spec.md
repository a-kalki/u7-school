# UI-спецификация: Контроллер learning

**Контроллер:** `learning`  
**Роль:** STUDENT  
**Кнопка в главном меню:** «🎓 Моя учёба» (только для STUDENT, priority: 20)

---

## Стори

### 1. `hub` — Хаб «Моя учёба»

**Callback-коды:**
| Код | Описание |
|-----|----------|
| `hub:my-study` | Главный хаб обучения |
| `hub:my-study:leave-confirm` | Подтверждение выхода из потока |
| `hub:my-study:leave` | Выполнение выхода из потока |

**Кнопки хаба (для активного студента):**
- ▶️ Продолжить учёбу / ▶️ Начать учёбу → `step-view:my-study:continue`
- 📂 Уроки → `nav-tree:my-study:lessons`
- 📊 Мой прогресс → `progress:progress:{streamId}`
- 🚪 Покинуть поток → `hub:my-study:leave-confirm`
- ↩️ Главное меню → `app:main-menu`

**Кнопки хаба (для завершившего):**
- 📊 Мой прогресс → `progress:progress:{streamId}`
- 🚪 Покинуть поток → `hub:my-study:leave-confirm`
- ↩️ Главное меню → `app:main-menu`

---

### 2. `step-view` — Просмотр/прохождение шага (S05a)

**Callback-коды:**
| Код | Описание |
|-----|----------|
| `step-view:my-study:continue` | Показать текущий шаг |
| `step-view:complete:{streamId}:{stepId}` | Отметить шаг выполненным |
| `step-view:my-study:view:{streamId}:{stepId}` | Просмотр завершённого шага |

**Шаг в процессе:**
- Кнопка «✅ Выполнено» → `step-view:complete:{streamId}:{stepId}`
- ↩️ Главное меню

**Завершённый шаг (просмотр):**
- ◀️ Назад / ▶️ Вперёд → `step-view:my-study:view:{streamId}:{prev|next}`
- ⬅️ Назад к уроку → `nav-tree:my-study:lesson:{lessonId}`
- ↩️ Главное меню

**Завершение урока:**
- 🎉 Урок завершён! Сообщение с прогрессом
- ▶️ Начать следующий урок → `step-view:my-study:continue`
- ↩️ Главное меню

**Завершение проекта:**
- 🚀 Проект завершён! Сообщение с прогрессом
- ▶️ Начать следующий проект → `step-view:my-study:continue`
- ↩️ Главное меню

**Завершение потока:**
- 🏆 Поток полностью завершён!
- ↩️ Главное меню

---

### 3. `nav-tree` — Дерево уроков (S05b)

**Callback-коды:**
| Код | Описание |
|-----|----------|
| `nav-tree:my-study:lessons` | Список проектов (уровень 1) |
| `nav-tree:my-study:project:{index}` | Уроки проекта (уровень 2) |
| `nav-tree:my-study:lesson:{lessonId}` | Шаги урока (уровень 3) |

**Уровень 1 — Проекты:**
- 📁 Проект N (X/Y) → `nav-tree:my-study:project:{N}`
- ⬅️ Назад к учёбе → `hub:my-study`

**Уровень 2 — Уроки проекта:**
- 📝 Урок N (X/Y) → `nav-tree:my-study:lesson:{lessonId}`
- ⬅️ Назад к проектам → `nav-tree:my-study:lessons`

**Уровень 3 — Шаги урока:**
- ✅ Описание (completed) → `step-view:my-study:view:{streamId}:{stepId}`
- ▶️ Описание (current) → `step-view:my-study:continue`
- 🔒 — не показывается кнопкой
- ⬅️ Назад к урокам → `nav-tree:my-study:project:{N}`

---

### 4. `transition` — Завершение урока/проекта/потока (S05c)

Логика перехода встроена в `step-view`. Стори `transition` зарезервирована для будущих прямых вызовов.

---

### 5. `progress` — Прогресс студента (S06)

**Callback-коды:**
| Код | Описание |
|-----|----------|
| `progress:progress:{streamId}` | Показать детальный прогресс |

**Экран прогресса:**
- 📊 Общий прогресс (progress bar)
- По каждому проекту: ✅/▶️/🔒, название, progress bar
- По каждому уроку: отступ + ✅/▶️/🔒, название, progress bar
- 📝 Всего шагов завершено: X из Y
- ⬅️ Назад к учёбе → `hub:my-study`
- ↩️ Главное меню

---

### 6. `enroll` — Запись с кодовым словом (S10)

**Callback-коды:**
| Код | Описание |
|-----|----------|
| `enroll:enroll:{streamId}` | Начать запись на поток |
| `enroll:cancel:{streamId}` | Отменить ввод кодового слова |

**Публичные действия:**
- `enrollButton(streamId)` → кнопка «📝 Записаться», код `enroll:enroll:{streamId}`

**Поток без кодового слова:**
- Сразу зачисление → делегат `hub:my-study`

**Поток с кодовым словом:**
- Запрос ввода → captureInput `enroll/enroll-key`
- 3 попытки
- Верное слово → зачисление → делегат `hub:my-study`
- Неверное слово → сообщение об оставшихся попытках
- Исчерпаны → возврат к карточке потока
- Отмена → возврат к карточке потока

---

## Видимость

- Контроллер `learning` доступен только роли STUDENT
- Кнопка «📝 Записаться» видна в `view-stream` всем НЕ-STUDENT (гость, кандидат, ментор, админ, автор)
- Правило доступа: `!UserPolicy.isStudent(actor)` (в `StreamPolicy.canEnroll`)
