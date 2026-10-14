# Telegram: editMessageText по tgId dev-персоны — «400: chat not found»

- **Симптомы:** в dev-режиме бот работает (меню приходит), но в логах варн:
  `Ошибка Telegram API (editMessageText)` с мета
  `{"error":"GrammyError: Call to 'editMessageText' failed! (400: Bad Request: chat not found)"}`
  и `tgId` фикстурной персоны (1003/1004/1007/1008).
- **Причина:** dev-панель персон (`apps/u7-bot/scripts/dev-persona.ts`)
  подменяет автора апдейта: домен видит фикстурного пользователя с его
  tgId. Исходящий редирект `wrapApi` изначально перехватывал только
  `sendMessage` — а `editMessageText` (и прочие адресные методы:
  `sendPhoto`, `deleteMessage`, ...) уходил с chat_id персоны напрямую.
  У бота нет реального чата с фикстурным tgId → Telegram отвечает
  «chat not found».
- **Решение:** в `wrapApi` не перечислять методы по одному — перехватывать
  любой вызов API, у которого **первый аргумент — число из redirects**
  (первый аргумент всех адресных методов Bot API — это chat_id):

  ```ts
  return new Proxy(api, {
    get(target, prop) {
      const value: unknown = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      const fn = (value as (...a: unknown[]) => unknown).bind(target);
      return (...args: unknown[]) => {
        const [first, ...rest] = args;
        if (typeof first === 'number' && redirects.has(first)) {
          return fn(redirects.get(first), ...rest);
        }
        return fn(...args);
      };
    },
  });
  ```

  Число первым аргументом в методах Bot API без chat_id не встречается,
  поэтому универсальная проверка безопасна. Тест-кейс —
  `dev-persona.test.ts` («editMessageText(1004, ...)» редиректится в
  dev-чат).
