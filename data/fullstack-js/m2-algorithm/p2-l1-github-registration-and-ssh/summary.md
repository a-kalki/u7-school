# Регистрация на GitHub и SSH — краткая выжимка

⏱ **Видео:** ~15 мин

- **GitHub** — облачный хостинг Git-репозиториев. Нужен для бэкапов, совместной работы и PR
- **Регистрация:** github.com → Sign up → email + username + пароль → подтвердить email
- **SSH-ключи** — пара: приватный (секретный, никому не показывать) + публичный (добавляем на GitHub)
- Генерация: `ssh-keygen -t ed25519 -C "email@example.com"`
- Публичный ключ: `cat ~/.ssh/id_ed25519.pub` → скопировать → GitHub Settings → SSH keys → Add
- Проверка: `ssh -T git@github.com` → должно быть «successfully authenticated»
- `Permission denied` → проверить, что ключ добавлен в SSH keys, скопирован полностью, пользователь `git`

[Полный конспект](./lesson.md)
