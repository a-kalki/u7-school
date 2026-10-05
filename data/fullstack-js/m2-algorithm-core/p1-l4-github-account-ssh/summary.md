# GitHub: аккаунт и SSH — краткая выжимка

- GitHub — хостинг репозиториев: бэкап, портфолио, ревью, командная работа
- Регистрация: профессиональный username (`ivan-petrov`, а не `xXx_cool_guy_2005`)
- SSH-ключ вместо пароля: `ssh-keygen -t ed25519 -C "email"` (Windows — Git Bash)
- Публичный ключ (`id_ed25519.pub`) — на GitHub; приватный — никогда никому не показывать
- Проверка: `ssh -T git@github.com` → «Hi <username>! ... successfully authenticated»
- Privat-ключ скомпрометирован → удалить ключ на GitHub и сгенерировать новую пару
- На каждый компьютер — своя пара ключей

[Полный конспект](./lesson.md)
