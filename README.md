# Telegram AI Assistant Mini App

Telegram Mini App с AI ассистентом: React (Vite, Tailwind, FSD) + NestJS + OpenAI.

## Структура
```
./
├─ frontend/              # React + Vite (FSD, Tailwind)
│  ├─ src/app
│  ├─ src/pages
│  ├─ src/widgets
│  ├─ src/features
│  ├─ src/entities
│  └─ src/shared
├─ backend/               # NestJS + TypeORM (SQLite), OpenAI, Telegram guard
├─ docker-compose.yml     # Front + Back в прод окружении
├─ .github/workflows/     # Автодеплой по push в main
└─ README.md
```

## Требования
- Node.js LTS (18/20)
- npm
- Docker / Docker Compose (для контейнерного запуска)

## Установка и запуск (локально)
1) Установить зависимости в корне (монорепа):
```
npm install
```
2) Настроить переменные окружения:
- backend/.env (см. backend/.env.example)
- frontend/.env.local (опционально, см. frontend/.env.example)
3) Запуск dev-среды (оба сервиса):
```
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Переменные окружения (backend)
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
TELEGRAM_DEV_BYPASS=true               # dev-режим без Telegram initData

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

TELEGRAM_BOT_TOKEN=123456:REAL_BOT_TOKEN
```

## Переменные окружения (frontend)
```
# Если фронтенд и бэкенд на одном домене через /api
VITE_API_BASE_URL=/api

# Для локалки, если бэкенд отдельно
# VITE_API_BASE_URL=http://localhost:3001/api
```

## Скрипты (корень)
```
# dev
npm run dev                # фронтенд + бэкенд
npm run frontend:dev
npm run backend:dev

# prod
npm run build              # сборка обоих
npm run start              # backend(prod) + frontend(preview)

# ngrok (для Telegram теста)
npm run tunnel:backend     # проброс 3001
npm run tunnel:frontend    # проброс 5173
```

## Docker
Запуск в контейнерах:
```
docker compose up --build
```
- Frontend: http://localhost:5173
- API (проксируется через nginx фронта): http://localhost:5173/api

Для production задайте переменные окружения (см. docker-compose.yml → services.backend.environment) через `.env` рядом с compose или напрямую в окружении сервера.

## CI/CD (GitHub Actions)
- Workflow: `.github/workflows/deploy.yml`
- Деплой по push в `main`:
  - SSH на сервер → `git pull` → `docker compose up -d --build`
- Настроить Secrets в репозитории:
  - `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PROJECT_PATH`

## Telegram Mini App
- Web App URL (BotFather): укажите `https://ваш-домен`
- Требуется HTTPS. Если используете docker-compose и свой nginx/traefik — проксируйте `/api` → backend:3001.
- В production отключите `TELEGRAM_DEV_BYPASS`.

## Архитектура фронтенда (FSD)
- Слои: `app`, `pages`, `widgets`, `features`, `entities`, `shared`
- Zustand stores: `entities/user`, `entities/chat`, `entities/message`
- API-клиент: `shared/api/http` (Axios, интерцепторы)

## Полезные проверки
```
# Получить чаты (dev-bypass)
curl http://localhost:3001/api/chats/1

# Создать чат
curl -X POST http://localhost:3001/api/chats \
  -H "Content-Type: application/json" \
  -d '{"name":"Test chat","userId":1}'

# Отправить сообщение
curl -X POST http://localhost:3001/api/chats/messages \
  -H "Content-Type: application/json" \
  -d '{"chatId":1,"message":"Hello"}'
```

## 🚀 CI/CD и Деплой

### Автоматический деплой через GitHub Actions

1. **Настрой GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `SSH_PRIVATE_KEY` - приватный SSH ключ
   - `SSH_HOST` - IP/домен сервера
   - `SSH_USER` - пользователь SSH (например, `gitdeploy`)
   - `SSH_PROJECT_PATH` - путь к проекту на сервере
   - `OPENAI_API_KEY` - твой OpenAI API ключ
   - `TELEGRAM_BOT_TOKEN` - токен Telegram бота

2. **Push в main** → автоматический деплой

### Ручной деплой

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

### Docker команды

```bash
# Разработка
npm run docker:dev

# Продакшен
npm run docker:prod

# Управление
npm run docker:logs    # логи
npm run docker:down    # остановка
npm run docker:build   # пересборка
```

Подробная инструкция в [DEPLOYMENT.md](DEPLOYMENT.md)