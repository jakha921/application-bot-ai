# 🚀 Быстрый старт - Ariza AI Bot

## Запуск приложения

### 1. Backend (Django)
```bash
cd app
python manage.py runserver
# Откроется на http://localhost:8000
```

### 2. Frontend (React)
```bash
cd frontend
npm run dev
# Откроется на http://localhost:5173
```

## Первый вход
- **URL:** http://localhost:5173/login
- **Email:** `test@example.com`
- **Пароль:** `testpass123`

## Создание бота

1. **Получите токен от @BotFather в Telegram:**
   - `/newbot` → следуйте инструкциям
   - Скопируйте токен: `123456789:ABC-DEF...`

2. **В приложении:**
   - Боты → Создать бота
   - Вставьте токен
   - Нажмите "Создать"

3. **Тестируйте:**
   - Найдите бота в Telegram
   - Отправьте `/start`
   - Общайтесь с ботом!

## Основные разделы

- **📊 Дашборд** - статистика
- **🤖 Боты** - управление ботами
- **💬 Тест чата** - симуляция диалога
- **📝 Шаблоны** - создание шаблонов документов
- **📈 Мониторинг** - просмотр диалогов
- **⚙️ Настройки** - конфигурация AI
- **👥 Пользователи** - управление командой

## API Endpoints

```bash
# Логин
POST http://localhost:8000/api/auth/login/

# Боты
GET/POST http://localhost:8000/api/bots/
PUT/DELETE http://localhost:8000/api/bots/{id}/

# Шаблоны
GET/POST http://localhost:8000/api/templates/
PUT/DELETE http://localhost:8000/api/templates/{id}/

# Аналитика
GET http://localhost:8000/api/analytics/
```

## Структура проекта

```
ariza-ai-bot/
├── app/                    # Django Backend
│   ├── core/              # Модели, Views, Serializers
│   ├── api/               # API URLs
│   ├── organizations/     # Multi-tenancy
│   └── manage.py
│
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── pages/        # Страницы
│   │   ├── components/   # Компоненты
│   │   ├── hooks/        # API hooks
│   │   └── schemas/      # Zod валидация
│   └── package.json
│
├── docs/                  # N8n workflow (legacy)
└── README.md
```

## Полезные команды

```bash
# Django
python manage.py migrate        # Применить миграции
python manage.py createsuperuser # Создать админа
python manage.py shell          # Django shell

# Frontend
npm install                     # Установить зависимости
npm run build                   # Production build
npm run preview                 # Preview build
```

## Переменные окружения (.env)

```bash
# AI Provider
AI_PROVIDER=openai              # или gemini
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC...

# Database
POSTGRES_DB=ariza_bot
POSTGRES_USER=ariza_user
POSTGRES_PASSWORD=ariza_password
```

## Помощь

📖 Полное руководство: `USER_GUIDE.md`
🧪 План тестирования: `E2E_TEST_PLAN.md`
📧 Поддержка: support@ariza-ai.uz
