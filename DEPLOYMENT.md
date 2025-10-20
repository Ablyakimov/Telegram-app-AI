# 🚀 Инструкция по деплою

## GitHub Secrets

В настройках репозитория (Settings → Secrets and variables → Actions) добавь:

### Обязательные секреты:
- `SSH_PRIVATE_KEY` - приватный SSH ключ для доступа к серверу
- `SSH_HOST` - IP адрес или домен сервера
- `SSH_USER` - пользователь для SSH (например, `gitdeploy`)
- `SSH_PROJECT_PATH` - путь к проекту на сервере (например, `/home/gitdeploy/app`)
- `OPENAI_API_KEY` - твой OpenAI API ключ
- `TELEGRAM_BOT_TOKEN` - токен твоего Telegram бота

### Как получить SSH ключи:

1. **На локальной машине:**
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions -N ""
```

2. **Добавить публичный ключ на сервер:**
```bash
ssh-copy-id -i ~/.ssh/github_actions.pub gitdeploy@YOUR_SERVER_IP
```

3. **Добавить приватный ключ в GitHub Secrets:**
```bash
cat ~/.ssh/github_actions
# Скопируй содержимое и добавь как SSH_PRIVATE_KEY
```

## Автоматический деплой

После настройки секретов:
1. Сделай push в ветку `main`
2. GitHub Actions автоматически:
   - Подключится к серверу
   - Обновит код
   - Создаст .env файл с продакшен настройками
   - Запустит Docker контейнеры
   - Запустит Nginx proxy

## Ручной деплой

Если нужно запустить вручную:
```bash
# На сервере
cd /path/to/project
echo 'NODE_ENV=production' > .env
echo 'OPENAI_API_KEY=your_key' >> .env
echo 'TELEGRAM_BOT_TOKEN=your_token' >> .env
echo 'CORS_ORIGIN=https://24ablyakimov.ru' >> .env
echo 'VITE_API_BASE_URL=/api' >> .env
docker compose up -d --build
docker compose --profile production up nginx -d
```

## Проверка деплоя

- Frontend: https://24ablyakimov.ru
- Backend API: https://24ablyakimov.ru/api
- Логи: `docker compose logs -f`
