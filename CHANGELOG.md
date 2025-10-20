# Changelog

Все важные изменения в проекте будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-10-20

### Added
- Универсальная Docker конфигурация с поддержкой NODE_ENV
- Автоматический CI/CD через GitHub Actions
- Nginx proxy для продакшена
- Подробная документация по деплою

### Fixed
- Исправлена конфигурация Nginx для правильной работы с контейнерами
- Frontend production stage теперь слушает на порту 80
- Улучшена обработка ошибок в API

### Changed
- Упрощена структура docker-compose файлов
- Обновлены скрипты для управления Docker контейнерами
- Улучшена документация в README.md

## [1.0.0] - 2024-10-19

### Added
- Базовая функциональность Telegram Mini App
- React frontend с FSD архитектурой
- NestJS backend с TypeORM и SQLite
- Интеграция с OpenAI API
- Telegram Web App SDK интеграция
- Tailwind CSS для стилизации
- Zustand для state management
- Docker контейнеризация
- Базовая авторизация через Telegram initData
