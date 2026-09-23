# Deploy: ssh-запуск deploy.sh — bun/pm2 «command not found»

- **Симптомы:** деплой по ssh (`ssh kalki_server 'cd /srv/u7-school && bash scripts/deploy.sh X.Y.Z'`)
  падает на шагах `pm2 restart` / `bun install`:
  `pm2: команда не найдена` (при запуске с локальной машины — pm2 есть только на сервере)
  или `bun: command not found` (на сервере bun в `~/.bun/bin`, не входящем в PATH
  неинтерактивной ssh-сессии).
- **Причина:** неинтерактивная ssh-сессия не читает профиль целиком — PATH из
  `.profile`/`.bashrc` (где `~/.bun/bin` и npm-глобалы) не применяется.
- **Решение:** деплой выполняется **на сервере**, в рабочей копии `/srv/u7-school`,
  с явным PATH:

  ```bash
  ssh kalki_server 'cd /srv/u7-school && export PATH=$HOME/.bun/bin:$PATH \
    && bash scripts/deploy.sh X.Y.Z'
  ```

  Порядок версии: смотреть CHANGELOG — секция `[X]` может быть подготовлена,
  а тег не выпущен; текущую прод-версию — `ssh kalki_server 'cd /srv/u7-school
  && git describe --tags'`.
