# Ariza AI Bot

🤖 Умный Telegram бот для автоматической генерации юридических заявлений (ариза) для граждан Узбекистана с использованием AI.

## 🌟 Возможности

- ✅ **Голосовые сообщения** - распознавание речи на узбекском языке (Whisper/Gemini)
- ✅ **AI диалог** - интеллектуальный сбор информации (OpenAI/Gemini)
- ✅ **Word генерация** - автоматическое создание документов по шаблону
- ✅ **Веб-админка** - управление пользователями, диалогами, статистика
- ✅ **PostgreSQL** - надежное хранение истории диалогов
- ✅ **Docker** - простое развертывание

## 🏗️ Архитектура

```
Telegram User → aiogram Bot → [Whisper/Gemini] → [OpenAI/Gemini] → Word Generator → PostgreSQL
                                      ↓
                              Django Admin Panel
```

## 📋 Требования

- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (опционально)
- Telegram Bot Token
- OpenAI API Key или Google Gemini API Key

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
cd app
cp .env.example .env
# Отредактируйте .env и заполните все ключи API
```

### 2. Запуск с Docker (Рекомендуется)

```bash
# Сборка и запуск
docker-compose up -d

# Миграции базы данных
docker-compose exec app python manage.py migrate

# Создание суперпользователя для админки
docker-compose exec app python manage.py createsuperuser

# Просмотр логов
docker-compose logs -f app
```

### 3. Локальный запуск (без Docker)

```bash
# Установка зависимостей
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Настройка PostgreSQL (убедитесь что запущен)
createdb ariza_bot

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск бота в polling режиме
python manage.py runbot
```

## ⚙️ Конфигурация

### Переменные окружения (.env)

```env
# Django
DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,n8n.niuuz.online

# Database
POSTGRES_DB=ariza_bot
POSTGRES_USER=ariza_user
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/bot/webhook/

# AI Provider: 'openai' or 'gemini'
AI_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
WHISPER_MODEL=whisper-1

# Gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-pro

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Выбор AI провайдера

**OpenAI** (по умолчанию):
- Лучшая транскрипция голоса (Whisper)
- Высокое качество диалога (GPT-4)
- Требует платный аккаунт (~$10/месяц)

**Gemini**:
- Бесплатный план (лимиты)
- Хорошее качество диалога
- ⚠️ Нет транскрипции голоса (нужен OpenAI Whisper)

Для использования Gemini с голосом:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
# Whisper всё равно нужен для голоса
OPENAI_API_KEY=sk-proj-...  
```

## 🎮 Использование

### Запуск бота

**Polling режим** (для разработки):
```bash
python manage.py runbot
```

**Webhook режим** (для продакшена):
```bash
# 1. Настройте webhook
python manage.py setwebhook --url https://your-domain.com/bot/webhook/

# 2. Запустите Django сервер
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Админ панель

```bash
# Откройте в браузере
http://localhost:8000/admin/

# Доступные секции:
- Telegram Users - управление пользователями
- Conversations - история диалогов
- Messages - все сообщения
- Documents - сгенерированные документы
- Statistics - ежедневная статистика
```

## 📊 Статистика и мониторинг

Django Admin автоматически собирает:
- Количество пользователей (всего/новых)
- Количество диалогов (всего/завершенных)
- Количество сообщений (всего/голосовых)
- Количество документов

## 🔧 Разработка

### Структура проекта

```
app/
├── config/              # Django настройки
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                # Модели базы данных
│   ├── models.py
│   └── admin.py
├── bot/                 # Telegram bot
│   ├── bot.py          # Инициализация
│   ├── handlers.py     # Обработчики сообщений
│   ├── views.py        # Webhook view
│   └── management/     # Management commands
├── ai_services/         # AI интеграции
│   └── providers.py    # OpenAI/Gemini
├── documents/           # Word генератор
│   └── generator.py
├── manage.py
├── requirements.txt
└── docker-compose.yml
```

### Добавление новых AI провайдеров

1. Создайте класс в `ai_services/providers.py`:
```python
class NewAIService(BaseAIService):
    def transcribe_audio(self, audio_file, language='uz'):
        # Ваша реализация
        pass
    
    def chat_completion(self, messages, system_prompt=None):
        # Ваша реализация
        pass
```

2. Добавьте в `get_ai_service()`:
```python
elif provider == 'newai':
    return NewAIService()
```

3. Обновите `.env`:
```env
AI_PROVIDER=newai
NEWAI_API_KEY=your_key
```

## 🐛 Отладка

### Просмотр логов

```bash
# Docker
docker-compose logs -f app

# Локально
tail -f logs/django.log
```

### Проверка здоровья

```bash
# PostgreSQL
docker-compose exec postgres psql -U ariza_user -d ariza_bot

# Redis
docker-compose exec redis redis-cli ping

# Django
docker-compose exec app python manage.py check
```

### Типичные проблемы

**Бот не отвечает**:
```bash
# Проверьте токен
python manage.py shell
>>> from bot.bot import bot
>>> import asyncio
>>> asyncio.run(bot.me())
```

**Whisper не транскрибирует**:
- Проверьте баланс OpenAI
- Убедитесь что `OPENAI_API_KEY` корректный

**База данных не подключается**:
```bash
# Проверьте PostgreSQL
docker-compose exec postgres pg_isready
```

## 🚢 Развертывание на сервере

### С nginx (webhook режим)

1. Настройте nginx:
```nginx
server {
    listen 80;
    server_name n8n.niuuz.online;
    
    location /bot/webhook/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
    
    location /static/ {
        alias /path/to/app/staticfiles/;
    }
}
```

2. Получите SSL сертификат:
```bash
sudo certbot --nginx -d n8n.niuuz.online
```

3. Настройте webhook:
```bash
python manage.py setwebhook --url https://n8n.niuuz.online/bot/webhook/
```

4. Запустите через systemd:
```bash
sudo nano /etc/systemd/system/ariza-bot.service
```

```ini
[Unit]
Description=Ariza AI Bot
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/app
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ariza-bot
sudo systemctl start ariza-bot
```

## 📝 Лицензия

MIT License

## 🤝 Поддержка

Если возникли вопросы:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте документацию: `docs/`
3. Создайте issue в GitHub

## 🔄 Миграция с n8n

Если у вас уже работает n8n версия:
1. Оба решения могут работать параллельно
2. Используйте разные Telegram Bot токены
3. Django версия - для production, n8n - для экспериментов

## 📚 Дополнительная документация

- [n8n Workflow Guide](../docs/N8n Telegram Voice Workflow Guide.md)
- [Flask API Reference](../docs/Flask API Server for Telegram Workflow.py)
- [Setup Checklist](../docs/N8n Telegram Voice Workflow Checklist.md)

---

**Made with ❤️ for Uzbekistan citizens**
