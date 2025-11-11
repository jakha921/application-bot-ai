# 🤖 Максимально Эффективное Руководство: Разработка SaaS с AI (VS Code + Copilot)

## 📋 Оглавление
1. [Подготовка проекта](#подготовка)
2. [Структура промптов](#промпты)
3. [Работа с GitHub Copilot](#copilot)
4. [Пошаговая методология](#методология)
5. [Best Practices](#best-practices)
6. [Примеры промптов](#примеры)

---

## 🎯 Подготовка проекта {#подготовка}

### 1. Создайте файл `.github/copilot-instructions.md`

Это **главный файл** для настройки контекста Copilot во всём проекте.

```markdown
# Bot Factory SaaS Platform - AI Development Context

## Project Overview
We're building "Bot Factory" - a multi-tenant SaaS platform that allows organizations to create, train, and deploy their own AI bots (Telegram, API, etc.).

## Tech Stack
- **Backend**: Django 4.2+, Django REST Framework
- **Frontend**: React 18, TypeScript, TanStack Query, Zustand
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **AI**: OpenAI GPT-4 / Google Gemini
- **Document Processing**: python-docx, PyPDF2

## Architecture Principles
1. **Multi-tenancy**: All data isolated by Organization
2. **RESTful API**: DRF with proper serializers
3. **Type Safety**: TypeScript strict mode
4. **Clean Code**: SOLID, DRY principles
5. **Testing**: Pytest (backend), Jest (frontend)

## Code Style
- **Python**: PEP 8, type hints, docstrings
- **TypeScript**: ESLint, Prettier
- **Naming**: snake_case (Python), camelCase (TS)

## Key Models
```python
Organization → Bot → KnowledgeBaseFile
              ↓
         Conversation → Message
```

## Current Phase
We're in **Phase 1: Core Refactoring**
- Adapting models from "Ariza AI" to generic "Bot Factory"
- Removing legal document specifics
- Adding system_prompt, bot_type fields
- Implementing RAG knowledge base

## Critical Rules
1. NEVER write code snippets - always provide FULL file content
2. Include all imports, docstrings, type hints
3. Follow Django best practices (signals, managers, querysets)
4. Use async where appropriate (aiogram, FastAPI endpoints)
5. Always include migration files
```

### 2. Создайте `.copilot/` папку с инструкциями по компонентам

```
.copilot/
├── backend.md          # Django/DRF patterns
├── frontend.md         # React/TS patterns
├── models.md           # Database schema guide
└── api.md             # API design rules
```

#### Пример `.copilot/backend.md`:
```markdown
# Backend Development Rules

## Django Models
```python
# Always use:
- UUID primary keys for security
- created_at, updated_at timestamps
- verbose_name and help_text
- related_name for relationships
- Meta class with ordering, indexes

# Example:
class Bot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        related_name='bots',
        help_text="Organization that owns this bot"
    )
    name = models.CharField(max_length=255, verbose_name="Bot Name")
    system_prompt = models.TextField(
        help_text="System instruction for AI behavior"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
        ]
```

## DRF Serializers
- Use ModelSerializer with explicit fields
- Add validation methods
- Include nested serializers for relationships
```

---

## 🎨 Структура промптов {#промпты}

### Анатомия идеального промпта

```
[КОНТЕКСТ] → [РОЛЬ] → [ЗАДАЧА] → [ОГРАНИЧЕНИЯ] → [ФОРМАТ ВЫВОДА]
```

### 1. Контекст (Context)
```
Мы разрабатываем Bot Factory - multi-tenant SaaS платформу.
Текущая фаза: Рефакторинг моделей Django из Ariza AI.
Файлы для изменения: app/core/models.py, app/core/serializers.py
```

### 2. Роль (Role)
```
Ты - Senior Django Developer с 10+ годами опыта в SaaS архитектуре.
Ты специализируешься на multi-tenant системах и RESTful API.
```

### 3. Задача (Task)
```
Задача: Рефакторить модель Bot в models.py
- Добавить поле system_prompt (TextField)
- Добавить поле bot_type (CharField с choices)
- Убрать поля total_conversations, total_documents
- Сохранить backward compatibility через migration
```

### 4. Ограничения (Constraints)
```
ВАЖНО:
- Предоставь ПОЛНОЕ содержимое файла, не фрагменты
- Включи все импорты
- Добавь docstrings к каждому методу
- Создай миграцию с RenameField, AddField
- Сохрани Multi-tenant изоляцию (фильтрация по organization)
```

### 5. Формат вывода (Output Format)
```
Предоставь:
1. Полный код models.py (с комментариями)
2. Код миграции 0005_refactor_bot_model.py
3. Обновленный serializers.py
4. Пример использования в views.py
```

---

## 💡 Работа с GitHub Copilot в VS Code {#copilot}

### Режимы работы Copilot

#### 1. **Inline Suggestions** (автодополнение)
```python
# Начните писать код, Copilot предложит продолжение
class Bot(models.Model):
    # Copilot предложит поля на основе .github/copilot-instructions.md
```

**Горячие клавиши:**
- `Tab` - принять предложение
- `Alt+]` - следующее предложение
- `Alt+[` - предыдущее предложение
- `Ctrl+Enter` - открыть панель с 10 вариантами

#### 2. **Copilot Chat** (диалоговый режим)
```
Открыть: Ctrl+Shift+I (Windows/Linux) или Cmd+Shift+I (Mac)
```

**Команды в Chat:**
- `/explain` - объяснить выделенный код
- `/fix` - исправить ошибки
- `/tests` - сгенерировать тесты
- `/doc` - добавить docstrings
- `@workspace` - использовать контекст всего проекта

#### 3. **Copilot Edits** (редактирование файлов)
```
Открыть: Ctrl+Shift+I → кнопка "Copilot Edits"
```

Позволяет давать команды для одновременного редактирования нескольких файлов.

### Примеры эффективных запросов в Copilot Chat

#### ✅ Хороший запрос:
```
@workspace Refactor the Bot model in app/core/models.py:
1. Add system_prompt field (TextField, help_text="AI instructions")
2. Add bot_type field (CharField, choices=['chatbot', 'assistant', 'custom'])
3. Remove total_conversations and total_documents fields
4. Generate migration file
5. Update BotSerializer in serializers.py to include new fields

Keep multi-tenant isolation (filter by organization).
Provide FULL file content, not snippets.
```

#### ❌ Плохой запрос:
```
Добавь поле для промпта в Bot
```
(Слишком расплывчато, нет контекста)

---

## 🔄 Пошаговая методология разработки {#методология}

### Итеративный подход (AGILE для AI)

```
Фаза → Задача → Промпт → Код → Проверка → Коммит → Следующая фаза
```

### Пример: Фаза 1 - Рефакторинг моделей

#### Шаг 1.1: Анализ текущего кода
```bash
# В VS Code Copilot Chat:
@workspace Analyze app/core/models.py and list all models with their relationships.
Identify fields specific to "legal documents" that should be removed for generic bot platform.
```

#### Шаг 1.2: Планирование изменений
```bash
# Создайте файл: docs/refactoring_plan.md
@workspace Based on app/core/models.py, create a refactoring plan:
- Models to keep
- Models to rename
- Fields to add/remove
- New relationships needed
Format as markdown checklist.
```

#### Шаг 1.3: Генерация кода
```bash
# В Copilot Edits:
Refactor app/core/models.py according to docs/refactoring_plan.md.
Provide:
1. Full models.py content
2. Migration file (0005_refactor_for_bot_factory.py)
3. Updated serializers.py

Rules:
- Use UUID primary keys
- Add docstrings
- Keep backward compatibility in migration
```

#### Шаг 1.4: Проверка и тесты
```bash
@workspace Generate pytest tests for the new Bot model in tests/test_models.py.
Test:
- Field validation
- Multi-tenant isolation
- Relationships
```

#### Шаг 1.5: Коммит
```bash
git add app/core/models.py app/core/migrations/0005*.py
git commit -m "refactor: adapt Bot model for Bot Factory platform

- Add system_prompt field for AI instructions
- Add bot_type field (chatbot/assistant/custom)
- Remove legal document specific fields
- Update serializers and generate migration"
```

---

## 🎯 Best Practices для работы с AI {#best-practices}

### 1. **Используйте многоуровневый контекст**

```
Уровень 1: .github/copilot-instructions.md (глобальный)
Уровень 2: .copilot/backend.md (специфичный для домена)
Уровень 3: Комментарии в коде (локальный контекст)
```

Пример комментария для Copilot:
```python
# Bot model represents a user's AI bot instance
# Multi-tenant: always filter by organization
# Fields: name, system_prompt (AI instructions), bot_type (chatbot/assistant)
# Relationships: belongs to Organization, has many KnowledgeBaseFiles
class Bot(models.Model):
    # Copilot теперь понимает контекст и предложит правильные поля
```

### 2. **Пишите "якорные" комментарии**

```python
# TODO: Add validation for telegram_token format (should start with bot token pattern)
def clean_telegram_token(self):
    # Copilot сгенерирует валидацию на основе TODO
    pass
```

### 3. **Используйте type hints везде**

```python
# С type hints Copilot точнее предлагает код
from typing import Optional, List
from uuid import UUID

def get_bot_by_id(bot_id: UUID, organization_id: UUID) -> Optional[Bot]:
    # Copilot знает, что вернуть Bot или None
    return Bot.objects.filter(
        id=bot_id,
        organization_id=organization_id
    ).first()
```

### 4. **Работайте небольшими итерациями**

```
❌ Плохо: "Создай весь backend для Bot Factory"
✅ Хорошо: "Создай модель Bot с полями: name, system_prompt, bot_type"
   → Проверка → Коммит →
   "Создай BotSerializer с валидацией telegram_token"
   → Проверка → Коммит
```

### 5. **Создавайте "prompt templates"**

Файл: `.copilot/templates/create_model.md`
```markdown
# Template: Create Django Model

Create a new Django model in app/core/models.py:

**Model Name**: [MODEL_NAME]
**Fields**:
- [field_name]: [field_type] ([constraints])
- ...

**Relationships**:
- [relation_type] to [TargetModel] ([related_name])

**Requirements**:
- UUID primary key
- created_at, updated_at timestamps
- Docstring with purpose
- Meta class with ordering
- related_name for all ForeignKeys
- help_text for all fields

**Migration**: Generate migration file
**Serializer**: Update serializers.py
**Tests**: Generate basic CRUD tests
```

Использование:
```bash
# В Copilot Chat:
@workspace Use .copilot/templates/create_model.md to create KnowledgeBaseFile model
with fields: bot (FK), name, file, content, file_type, status
```

### 6. **Документируйте решения для AI**

Файл: `docs/architecture_decisions.md`
```markdown
# Architecture Decision Records (ADR)

## ADR-001: Multi-tenancy Implementation
**Date**: 2024-11-12
**Status**: Accepted

**Context**: Need to isolate data between organizations

**Decision**: 
- All models have organization FK
- Middleware sets request.organization from JWT
- Querysets filtered by organization in viewsets

**Copilot Rule**: 
Always include `organization` FK and filter by `request.organization` in views.
```

Теперь в промптах можно ссылаться:
```bash
@workspace Follow ADR-001 when creating new models
```

---

## 📚 Примеры промптов для типовых задач {#примеры}

### 1. Создание новой модели Django

```
@workspace Create a new Django model KnowledgeBaseFile in app/core/models.py

Requirements:
- Fields:
  * bot (ForeignKey to Bot, CASCADE, related_name='knowledge_files')
  * name (CharField, max 255)
  * file (FileField, upload_to='knowledge_base/', nullable)
  * content (TextField, nullable, for extracted text)
  * file_type (CharField, choices: text/pdf/docx/url)
  * status (CharField, choices: pending/processing/ready/error, default: pending)
- UUID primary key
- Timestamps (created_at, updated_at)
- Docstring
- Meta: ordering by created_at descending

Provide:
1. Full models.py with the new model
2. Migration file
3. ModelSerializer in serializers.py
4. ViewSet in views.py (CRUD endpoints)
5. Basic tests in tests/test_knowledge_base.py

Follow multi-tenant rules (filter by bot.organization).
```

### 2. Рефакторинг существующего кода

```
@workspace Refactor app/core/views.py BotViewSet:

Changes:
1. Add custom action @action(detail=True, methods=['post']) test_bot
2. In test_bot: accept {"message": "test text"}, call AI service, return response
3. Add permission check: only bot owner can test
4. Add rate limiting: 10 requests per minute
5. Add error handling with proper HTTP status codes

Rules:
- Use DRF best practices
- Add OpenAPI schema annotations
- Include docstrings
- Add unit tests

Provide full views.py content.
```

### 3. Создание React компонента

```
@workspace Create React component BotConfigPanel in frontend/src/features/bots/

Requirements:
- TypeScript
- Props: { botId: string }
- Fetch bot data using TanStack Query
- Form with react-hook-form + zod validation
- Fields: name, system_prompt (textarea), bot_type (select)
- Save button (PUT /api/bots/{id}/)
- Show success/error toasts
- Loading states

Use:
- shadcn/ui components (Card, Form, Input, Textarea, Select, Button)
- Tailwind CSS
- Zustand for global state

Provide:
1. Full BotConfigPanel.tsx
2. Type definitions (types.ts)
3. API hooks (api/useBots.ts)
4. Tests (BotConfigPanel.test.tsx)
```

### 4. Создание миграции

```
@workspace Generate Django migration for app/core:

Changes:
1. Rename model Template to KnowledgeBaseFile
2. Add field Bot.system_prompt (TextField)
3. Add field Bot.bot_type (CharField, choices, default='chatbot')
4. Remove field Bot.total_conversations
5. Remove field Bot.total_documents
6. Add FK KnowledgeBaseFile.bot (to Bot, CASCADE)

Migration name: 0005_refactor_for_bot_factory.py

Include:
- RenameModel operation
- AddField operations with default values
- RemoveField operations
- RunPython for data migration (if needed)
```

### 5. Написание тестов

```
@workspace Generate comprehensive tests for Bot model in app/core/tests/test_bot.py

Test cases:
1. test_create_bot_success (valid data)
2. test_create_bot_without_organization (should fail)
3. test_multi_tenant_isolation (user from org A can't see bots from org B)
4. test_system_prompt_validation (max length, not empty)
5. test_bot_type_choices (valid/invalid choices)
6. test_telegram_token_unique_per_org
7. test_bot_soft_delete (is_active=False, not delete)

Use:
- pytest
- pytest-django
- factory_boy for test data
- Mock external API calls

Follow AAA pattern (Arrange-Act-Assert).
Provide full test file.
```

### 6. Отладка и исправление ошибок

```
@workspace Fix the error in app/core/views.py BotViewSet.create()

Error:
```
IntegrityError: null value in column "organization_id" violates not-null constraint
```

Context:
- User is authenticated
- Request has organization in session
- Serializer validates correctly

Debug steps:
1. Check how organization is set in create method
2. Verify middleware sets request.organization
3. Fix the issue
4. Add validation to prevent this error
5. Add test case for this scenario

Provide:
- Fixed views.py
- Explanation of the issue
- New test case
```

---

## 🚀 Продвинутые техники

### 1. Chain-of-Thought промптинг

```
@workspace Implement Telegram bot webhook handler in app/telegram_bot/views.py

Think step-by-step:
1. Receive webhook POST from Telegram
2. Verify webhook signature (security)
3. Extract bot token from URL path
4. Find Bot instance by token
5. Get bot's organization and system_prompt
6. If message type is text:
   - Get conversation history from DB
   - Call AI service with system_prompt + history + new message
   - Save message to DB
   - Send response to Telegram API
7. If message type is voice:
   - Download audio file
   - Transcribe with Whisper
   - Process as text (step 6)
8. Handle errors gracefully

Provide:
- Full views.py with WebhookView
- Helper functions (verify_signature, get_bot_by_token)
- AI service integration (services/ai_service.py)
- Tests
```

### 2. Использование примеров (Few-shot)

```
@workspace Create ModelSerializer for KnowledgeBaseFile

Example of similar serializer in our codebase (BotSerializer):
```python
class BotSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = Bot
        fields = ['id', 'name', 'organization', 'organization_name', 'is_active']
        read_only_fields = ['id', 'created_at']
    
    def validate_telegram_token(self, value):
        if not value.startswith('bot'):
            raise serializers.ValidationError("Invalid token format")
        return value
```

Follow the same pattern for KnowledgeBaseFile:
- Include bot name in response
- Add file_url computed field
- Validate file_type choices
- Add custom validation for file OR content (one required)
```

### 3. Контекстное обучение (In-context learning)

Создайте `.copilot/examples/` с примерами:

`.copilot/examples/viewset_example.py`:
```python
"""
Example of a well-structured DRF ViewSet in our project.
Use this as reference when creating new ViewSets.
"""

class BotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bot CRUD operations.
    
    Permissions: User must belong to bot's organization
    Filtering: By organization (automatic via get_queryset)
    """
    
    serializer_class = BotSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    
    def get_queryset(self):
        """Filter bots by user's organization"""
        return Bot.objects.filter(
            organization=self.request.user.organization
        ).select_related('organization')
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Custom action: activate bot"""
        bot = self.get_object()
        bot.is_active = True
        bot.save()
        return Response({'status': 'activated'})
```

Теперь в промптах:
```
@workspace Use .copilot/examples/viewset_example.py as reference to create KnowledgeBaseFileViewSet
```

---

## 📊 Метрики эффективности работы с AI

### Отслеживайте:
1. **Acceptance Rate**: Сколько % предложений Copilot вы принимаете
2. **Time Saved**: Сколько времени экономите (Copilot показывает статистику)
3. **Bugs Introduced**: Сколько багов вносит AI-код (должно быть <5%)
4. **Refactoring Frequency**: Как часто приходится переписывать AI-код

### Цели:
- Acceptance Rate: >40%
- Time Saved: >30%
- Bugs: <5%
- Refactoring: <20%

---

## 🎓 Заключение и следующие шаги

### Ваш workflow:

```
1. Создайте .github/copilot-instructions.md (контекст проекта)
2. Настройте .copilot/ (шаблоны, примеры, правила)
3. Начните с малого: одна модель → миграция → сериализатор → тесты
4. Используйте итеративный подход: промпт → код → проверка → коммит
5. Документируйте решения (ADR) для будущих промптов
6. Создавайте переиспользуемые шаблоны промптов
```

### Начните прямо сейчас:

```bash
# 1. Создайте структуру
mkdir -p .copilot/{templates,examples}
touch .github/copilot-instructions.md
touch .copilot/{backend,frontend,models,api}.md

# 2. Скопируйте базовый контекст из этого руководства

# 3. Откройте VS Code и начните первую задачу:
code .

# 4. В Copilot Chat:
@workspace Based on .github/copilot-instructions.md, refactor app/core/models.py Bot model:
- Add system_prompt field
- Add bot_type field
- Generate migration

Provide full files.
```

---

**🎯 Главное правило**: AI - это усилитель вашей экспертизы, а не замена. Вы архитектор, AI - ваш быстрый исполнитель. Чем точнее вы ставите задачу, тем качественнее результат.

Удачи в разработке Bot Factory! 🚀