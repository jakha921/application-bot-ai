# 🤖 Ariza AI SaaS Platform

> Multi-tenant SaaS platform for creating AI-powered Telegram bots that generate legal documents (заявления/ariza) for Uzbekistan citizens.

[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 О проекте

Full-stack SaaS платформа для управления множественными AI ботами:
- 🏢 **Multi-tenant архитектура** с поддержкой организаций
- 🤖 **Множественные боты** на одном сервере
- 🎤 **Голосовой ввод** на узбекском языке (Whisper/Gemini)
- 🤖 **AI-диалоги** (GPT/Gemini)
- 📄 **Генерация документов** в Word формате
- � **Stripe биллинг** с подписками
- 📊 **Analytics dashboard**
- 🛍️ **Template marketplace**

## 🎯 Возможности

### Backend (Django + DRF)
✅ Multi-tenant organizations  
✅ RBAC (owner/admin/editor/viewer)  
✅ REST API с аутентификацией  
✅ PostgreSQL + Redis  
✅ Stripe интеграция  
✅ API key management  
✅ Bot management per organization  
✅ Template marketplace  

### Frontend (React + TypeScript)
✅ Modern React 18 + TypeScript  
✅ Tailwind CSS v4  
✅ TanStack Query + Zustand  
✅ Organization switcher  
✅ Protected routes  
✅ Dark mode support  

## 🏗️ Архитектура

```
Project/
├── app/                # Django Backend
│   ├── organizations/  # Multi-tenant core
│   ├── core/          # User models
│   ├── bot/           # Telegram bot
│   ├── documents/     # Word generation
│   └── api/           # REST endpoints
│
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── pages/     # Dashboard, Bots, Templates
│   │   ├── stores/    # Auth & Org state
│   │   ├── lib/       # API client
│   │   └── types/     # TypeScript types
│
└── docs/             # n8n Workflow (Legacy)
```

## 🚀 Quick Start

### Development Setup

**Backend (Django):**
```bash
cd app
cp .env.example .env  # Configure API keys, DB, etc.
uv sync                # Install dependencies
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver  # http://127.0.0.1:8000
```

**Frontend (React):**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**Test Credentials:**
- Email: `test@example.com`
- Password: `testpass123`

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000/api
- Django Admin: http://127.0.0.1:8000/admin

### Production Deployment

```bash
cd app
cp .env.example .env
# Edit .env with production settings
docker-compose up -d
docker-compose exec app python manage.py migrate
docker-compose exec app python manage.py createsuperuser
docker-compose exec app python manage.py collectstatic
```

## 📚 Документация

- **[USER_GUIDE.md](USER_GUIDE.md)** - Полное руководство пользователя
- **[QUICKSTART.md](QUICKSTART.md)** - Краткая справка
- **[E2E_TEST_PLAN.md](E2E_TEST_PLAN.md)** - План тестирования
- **[docs/](docs/)** - n8n Workflow (legacy)

## 📊 SaaS Plans

| Plan | Bots | Docs/month | Price |
|------|------|-----------|-------|
| **Free** | 1 | 10 | $0 |
| **Pro** | 5 | 500 | $29/mo |
| **Enterprise** | Unlimited | Unlimited | Custom |
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
