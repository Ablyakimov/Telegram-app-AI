# Резервное копирование базы данных

## Проблема

При деплое база данных может потерять данные, если volume будет случайно удален.

## Решение

Volume `pg_data` настроен в `docker-compose.yml` и должен сохраняться между деплоями. Однако для дополнительной защиты рекомендуется:

### 1. Регулярное резервное копирование

Создайте скрипт для бэкапа:

```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/home/gitdeploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cd /home/gitdeploy/app/Telegram-app-AI
docker compose exec -T postgres pg_dump -U app -d tg_ai_app > $BACKUP_DIR/db_backup_$DATE.sql

# Удалить старые бэкапы (оставить последние 7)
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

### 2. Автоматический бэкап через cron

Добавьте в crontab:
```bash
0 2 * * * /home/gitdeploy/backup-db.sh
```

### 3. Восстановление из бэкапа

```bash
cd /home/gitdeploy/app/Telegram-app-AI
docker compose exec -T postgres psql -U app -d tg_ai_app < /path/to/backup.sql
```

## Защита volume от удаления

Volume `pg_data` НЕ удаляется при:
- `docker compose down` (по умолчанию)
- `docker compose up -d`
- Пересборке контейнеров

Volume БУДЕТ удален при:
- `docker compose down -v` (с флагом `-v`)
- `docker volume rm telegram-app-ai_pg_data` (явное удаление)
- `docker system prune --volumes` (очистка всех неиспользуемых volumes)

## Проверка состояния базы данных

```bash
# Проверить наличие volume
docker volume ls | grep pg_data

# Проверить данные в базе
docker compose exec postgres psql -U app -d tg_ai_app -c "SELECT COUNT(*) FROM users;"
```

## Важно

⚠️ **НИКОГДА не используйте:**
- `docker compose down -v` в production
- `docker system prune --volumes` без проверки
- `docker volume rm` для production volumes

