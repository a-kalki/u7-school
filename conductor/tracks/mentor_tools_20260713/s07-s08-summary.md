# Итог трека mentor_tools_20260713

## Что сделано

### Подменю «Инструменты ментора»
- Кнопка в главном меню (role-gated: MENTOR/ADMIN)
- «Мои потоки» — список потоков ментора с переключателями завершённых/архивных
- «Создать поток» — wizard (перенесён из корня меню)

### S02m — Менторская карточка потока
- Наследует S02 (curious), добавляет lifecycle-кнопки:
  - 🚀 Запустить (enrollment → active)
  - ✅ Завершить (active → completed, с confirm)
  - 📁 В архив (completed → archived, с confirm)

### S07 — Мониторинг (список студентов)
- Публичный список с маркерами отставания (🛑/⚠️/🏃/✅/↩️/🚫)
- Секции: «Метрики группы» (по статусам), «Метрики по студентам» (с легендой)
- Кнопки: эмодзи + имя + процент. Детализация (прогресс-бар, время) — в тексте
- Кнопки действий: ⛔ бросил, ✅ завершить, 🔄 сменить исход (role-gated)

### S08 — Карточка студента
- Три секции через ———: Прогресс / Усидчивость / Активность
- Категории времени: 🏃 Бегун, ⚡ Спринтер, 🐢 Вдумчивый, 📚 Исследователь
- Только кнопка «Назад к списку» (действия — в S07)

### Каталог потоков (S01)
- Единые иконки: 🟡 набор, 🔵 обучение, 🟢 завершён, ⚫ архив
- Переключатели завершённых и архивированных потоков

## Ключевые файлы
- `packages/stream/src/ui/bot/stories/monitor.story.ts` — S07/S08
- `packages/stream/src/ui/bot/stories/view-stream-mentor.story.ts` — S02m
- `packages/stream/src/ui/bot/stories/catalog.story.ts` — S01
- `packages/stream/src/ui/bot/stories/mentor-tools.story.ts` — подменю
- `packages/stream/src/domain/stream-ds.ts` — StreamDs (computeStudentCard, computeStudentRowSummary, etc.)
- `packages/stream/src/domain/types.ts` — StudentRowSummary, StudentCardData, TimeCategory
