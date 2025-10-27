# 🗄️ Восстановление базы данных

## Проблема
База данных SQLite очищалась при каждом деплое, потому что:
- SQLite файл создавался в `/app/database.sqlite` (внутри контейнера)
- Volume мапился в `/app/data`, но база данных лежала в `/app/database.sqlite`
- При каждом деплое контейнер пересоздавался → база данных терялась

## ✅ Решение
Теперь база данных сохраняется в volume:
- **Production**: `/app/data/database.sqlite` (в volume)
- **Development**: `database.sqlite` (локально)

## 🔧 Что изменилось

### 1. `backend/src/app.module.ts`
```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : 'database.sqlite'),
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
}),
```

### 2. `backend/Dockerfile`
```dockerfile
# Create data directory for persistent SQLite database
RUN mkdir -p /app/data && chmod 755 /app/data
```

### 3. `docker-compose.yml`
```yaml
environment:
  - DATABASE_PATH=/app/data/database.sqlite
volumes:
  - backend_data:/app/data
```

### 4. `.github/workflows/deploy.yml`
```bash
echo 'DATABASE_PATH=/app/data/database.sqlite' >> .env
```

## 🚀 После деплоя

База данных теперь будет **сохраняться** между деплоями в Docker volume `backend_data`.

## 🔍 Проверка

Чтобы убедиться, что база данных сохраняется:

```bash
# На сервере
docker exec -it $(docker ps -q --filter "name=tg-ai-backend") ls -la /app/data/
# Должен показать database.sqlite

# Проверить размер volume
docker volume inspect tg-ai-app_backend_data
```

## ⚠️ Если данные уже потеряны

Если база данных уже была очищена, то:
1. **Пользователи** будут созданы заново при первом входе
2. **Чаты** будут созданы заново
3. **Подписки** нужно будет настроить заново

## 💡 Рекомендации

1. **Регулярные бэкапы**:
```bash
# Создать бэкап
docker exec $(docker ps -q --filter "name=tg-ai-backend") cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d).sqlite

# Восстановить из бэкапа
docker exec $(docker ps -q --filter "name=tg-ai-backend") cp /app/data/backup-20241201.sqlite /app/data/database.sqlite
```

2. **Мониторинг размера базы**:
```bash
docker exec $(docker ps -q --filter "name=tg-ai-backend") du -h /app/data/database.sqlite
```

3. **В будущем** рассмотреть переход на PostgreSQL для продакшена.
