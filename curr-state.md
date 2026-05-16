# Текущее состояние Onboarding (после рефакторинга Domain Evolution)

## Что было сделано

1.  **Домен Questionnaire:**
    *   Поле `userId` заменено на `telegramId: number` в сущности `Questionnaire`. Это отвязало анкету от внутренней системы ID пользователей и упростило интеграцию с ботом.
    *   Добавлено поле `draftAnswers: string[]` для хранения промежуточных выборов (черновиков).
    *   В агрегат `QuestionnaireAr` добавлен метод `toggleDraftAnswer` для управления черновиками.
    *   Метод `submitAnswer` теперь автоматически использует данные из черновиков для вопросов с выбором, если значение не передано явно.
2.  **API и UseCases:**
    *   Создан Query UC `get-onboarding-state-uc`, который возвращает текущий контекст анкеты (текущий вопрос, выбранные галочки и т.д.) по `telegramId`.
    *   Создан Command UC `toggle-draft-answer-uc`.
    *   Все существующие UC (`start`, `submit`, `abandon`, `list`) переведены на использование `telegramId` и из них убрана обязательная авторизация (`requiresAuth: false`), так как анкета в боте публична.
    *   Обновлен `QuestionnaireJsonRepo` для поддержки поиска по `telegramId`.
3.  **Интеграция с User:**
    *   В `UserFacade` и `UserModule` добавлен метод `ensureUserWithRole`. Он гарантирует наличие пользователя в системе с нужной ролью (создает GUEST при первом обращении и добавляет CANDIDATE при завершении анкеты).
4.  **UI Controller:**
    *   Полностью переписан `OnboardingController`. Теперь он stateless и работает через новый метод `handleUpdate(update)`.
    *   Контроллер сам запрашивает стейт через API и возвращает массив инструкций для бота (`BotResponse[]`).
    *   Добавлена поддержка автоматического сабмита для одиночного выбора.
5.  **Бот:**
    *   Удалены устаревшие `conversations` (`onboarding-conversation.ts`), которые вызывали нестабильность из-за хранения локального стейта.
    *   Обновлен `start-handler.ts` и `cancel-handler.ts` для работы с новой логикой (использование `telegramId` и `OnboardingController`).

---

## Флоу выполнения (Flow)

Работа системы построена на четком разделении обязанностей: **Бот** (транспорт) → **Контроллер** (логика отображения) → **UseCase** (оркестрация) → **Агрегат** (бизнес-правила).

### 1. Старт анкеты
*   **Controller**: Вызывает `start-questionnaire-uc` с `telegramId`.
*   **UseCase**: Проверяет отсутствие активных анкет, вызывает `QuestionnaireAr.start`.
*   **Aggregate**: Устанавливает `status: 'in_progress'`, определяет первый вопрос.
*   **Controller**: Запрашивает текущий стейт через `get-onboarding-state-uc` и отправляет боту `sendMessage` с вопросом.

### 2. Множественный выбор (Клик по варианту)
*   **Controller**: Получает `callback` с кодом ответа, вызывает `toggle-draft-answer-uc`.
*   **Aggregate**: Добавляет/удаляет код из `draftAnswers` (валидируя, что вопрос актуален).
*   **Controller**: Снова запрашивает стейт. Видит обновленные черновики. Отправляет боту `editMessage` с пометками `*[x]*` и кнопкой «Далее -->».

### 3. Множественный выбор (Нажатие «Далее»)
*   **Controller**: Получает `callback: next`, вызывает `submit-answer-uc` без значения.
*   **Aggregate**: Берет значения из `draftAnswers`, записывает в историю, переходит к следующему вопросу.

### 4. Одиночный выбор (Клик по варианту)
*   **Controller**: Сначала вызывает `toggle-draft-answer-uc`.
*   **Controller**: Видит, что вопрос не множественный, и сразу же вызывает `submit-answer-uc`.
*   **Результат**: Мгновенный переход к следующему вопросу для пользователя.

### 5. Ввод текста
*   **Controller**: Получает `message`, вызывает `submit-answer-uc` с текстом в качестве значения.

### 6. Завершение анкеты
*   **Aggregate**: Переводит статус в `completed`.
*   **UseCase (`submit-answer-uc`)**: Видит завершение, вызывает `userFacade.ensureUserWithRole(telegramId, Role.CANDIDATE)`.
*   **Controller**: Видит в стейте `status: 'none_active'` и `completedCount > 0`, отправляет финальное сообщение.
