# pi-antigravity: 403 VALIDATION_REQUIRED — Google требует верификацию аккаунта

- **Симптомы:** при выборе любой модели `antigravity/*` (Gemini, Claude, GPT-OSS)
  запрос падает с `Antigravity API error (403, ...): Antigravity denied this request.
  Next: re-login or try another model. Backend said: Verify your account to continue.`
  Инструменты `google_search` / `generate_image` (они тоже идут через Antigravity OAuth)
  отвечают тем же текстом. Re-login, refresh токена и смена модели не помогают.
- **Причина:** Google блокирует доступ к Cloud Code Assist до подтверждения аккаунта.
  API отвечает `403 PERMISSION_DENIED`, `reason=VALIDATION_REQUIRED` и кладёт
  одноразовую ссылку на верификацию в `details[0].metadata.validation_url`.
  `pi-antigravity` эту ссылку не показывает, поэтому выглядит как «модели не настроены».
- **Решение:** достать `validation_url` из ответа API и открыть её в браузере под тем же
  Google-аккаунтом, пройти проверку. Access-токен при этом валиден — refresh и повторный
  логин бесполезны.

  Запрос (подставить свой `projectId`; токен берётся из `~/.pi/agent/auth.json`):

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/.pi/agent/auth.json'))['antigravity']['access'])")
curl -s -X POST "https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "User-Agent: antigravity/cli/1.2.4" \
  --data '{"project":"aicode-consumers","model":"gemini-3.8-flash-low","requestType":"agent","userAgent":"antigravity","request":{"contents":[{"role":"user","parts":[{"text":"ping"}]}]}}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['error']['details'][0]['metadata']['validation_url'])"
```

  Открыть полученный URL под нужным аккаунтом → пройти верификацию → запрос заработал.
  Признак успеха:

```bash
pi --provider antigravity --model gemini-3.8-flash --no-tools --no-session -p "Ответь одним словом: pong"
```

  Если после верификации всё равно 403 — аккаунт не проходит eligibility Antigravity,
  тогда привязать другой Google-аккаунт через `/login antigravity`.
