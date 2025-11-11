# 🤖 Ariza AI Bot

> Умный Telegram бот для автоматической генерации юридических заявлений (ариза) для граждан Узбекистана с использованием искусственного интеллекта.

[![Django](https://img.shields.io/badge/Django-5.0-green.svg)](https://www.djangoproject.com/)
[![aiogram](https://img.shields.io/badge/aiogram-3.13-blue.svg)](https://docs.aiogram.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 О проекте

Ariza AI Bot помогает гражданам Узбекистана создавать официальные заявления (ариза) с помощью:
- 🎤 **Голосового ввода** на узбекском языке
- 🤖 **AI-ассистента** для сбора информации
- 📄 **Автоматической генерации** Word документов

## 🎯 Возможности

✅ Распознавание речи (Whisper/Gemini)  
✅ Интеллектуальный диалог (GPT/Gemini)  
✅ Генерация Word документов  
✅ Веб-админ панель  
✅ История диалогов (PostgreSQL)  
✅ Статистика использования  
✅ Docker развертывание  

## 🏗️ Архитектура

Проект содержит две реализации:

### 1. Django Application (Production) ⭐
**Рекомендуется для продакшена**

```
📁 app/
   ├── Django backend
   ├── aiogram 3.x bot
   ├── PostgreSQL database
   ├── Redis FSM storage
   └── Admin panel
```

**Стек**: Django + aiogram + PostgreSQL + Redis + Docker

👉 **[Быстрый старт](app/QUICKSTART.md)** | **[Полная документация](app/README.md)**

### 2. n8n Workflow (Prototype)
**Для экспериментов и прототипирования**

```
📁 docs/
   ├── n8n workflow JSON
   ├── Flask API server
   └── Setup guides
```

**Стек**: n8n + Flask + OpenAI + Anthropic Claude

👉 **[n8n Guide](docs/N8n Telegram Voice Workflow Guide.md)** | **[Checklist](docs/N8n Telegram Voice Workflow Checklist.md)**

## 🚀 Быстрый старт

### Вариант 1: Django App (Docker)

```bash
cd app
cp .env.example .env
# Отредактируйте .env - добавьте API ключи
docker-compose up -d
docker-compose exec app python manage.py migrate
docker-compose exec app python manage.py createsuperuser
```

Готово! Бот работает в polling режиме.

### Вариант 2: n8n Workflow

```bash
# См. подробную инструкцию
docs/N8n Telegram Voice Workflow Checklist.md
```

## 📊 Сравнение реализаций

| Функция | Django App | n8n Workflow |
|---------|-----------|--------------|
| **Сложность настройки** | Средняя | Простая |
| **Production ready** | ✅ Да | ⚠️ Прототип |
| **База данных** | PostgreSQL | n8n internal |
| **Админ панель** | ✅ Django Admin | ⚠️ n8n UI |
| **Статистика** | ✅ Полная | ❌ Нет |
| **Масштабируемость** | ✅ Высокая | ⚠️ Средняя |
| **AI провайдеры** | OpenAI/Gemini | OpenAI/Claude |
| **Webhook поддержка** | ✅ Да | ✅ Да |

## 📖 Документация

- 🚀 [Быстрый старт Django](app/QUICKSTART.md)
- 📚 [Полная документация Django](app/README.md)
- 🔧 [n8n Workflow Guide](docs/N8n Telegram Voice Workflow Guide.md)
- ✅ [n8n Checklist](docs/N8n Telegram Voice Workflow Checklist.md)
- 💡 [AI Coding Guidelines](.github/copilot-instructions.md)

## 🔑 Требования

### Для Django App:
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Docker (опционально)
- Telegram Bot Token
- OpenAI или Gemini API Key

### Для n8n Workflow:
- Docker & Docker Compose
- Telegram Bot Token
- OpenAI API Key
- Anthropic Claude API Key

## 🎮 Использование

1. **Создайте бота** через @BotFather в Telegram
2. **Настройте .env** с API ключами
3. **Запустите** приложение (см. Quick Start)
4. **Отправьте** голосовое или текстовое сообщение боту
5. **Получите** готовый Word документ!

## 🛠️ Технологии

### Django Application
- **Backend**: Django 5.0, Python 3.11
- **Bot**: aiogram 3.x
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **AI**: OpenAI API, Google Gemini
- **Documents**: python-docx
- **Deploy**: Docker, Gunicorn, Nginx

### n8n Workflow
- **Orchestration**: n8n
- **API**: Flask
- **AI**: OpenAI Whisper, Anthropic Claude
- **Documents**: python-docx

## 📈 Roadmap

- [x] Django standalone app
- [x] OpenAI/Gemini support
- [x] Admin panel with statistics
- [x] Docker deployment
- [ ] Multi-language support (Russian, English)
- [ ] Template library
- [ ] PDF export
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 Лицензия

MIT License - можете использовать свободно для коммерческих и некоммерческих целей.

## 💬 Поддержка

- 📧 Email: support@example.com
- 💬 Telegram: @ariza_support_bot
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ariza-ai-bot/issues)

## 🙏 Благодарности

- OpenAI за Whisper и GPT API
- Google за Gemini API
- Anthropic за Claude API
- n8n за workflow platform
- aiogram за отличную Telegram bot библиотеку

---

**Made with ❤️ for Uzbekistan**

*Помогая гражданам создавать юридические документы быстро и правильно*
