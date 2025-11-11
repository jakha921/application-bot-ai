# 🏗️ Архитектура SaaS Document AI Platform

## 🎯 Видение продукта

**Document AI Platform** - полноценный SaaS для автоматической генерации юридических документов с AI помощником.

### Ключевые возможности:
1. **Multi-tenant архитектура** - каждая компания изолирована
2. **AI Document Generator** - умная генерация документов
3. **Template Management** - библиотека шаблонов
4. **User Management** - управление командой и ролями
5. **Billing & Subscriptions** - монетизация через подписки
6. **Analytics Dashboard** - детальная статистика
7. **API Access** - интеграция с внешними системами

---

## 🏛️ Tech Stack

### Frontend (React + TypeScript)
```
├── React 18 + TypeScript
├── Vite (build tool)
├── TanStack Query (data fetching)
├── Zustand (state management)
├── Tailwind CSS + shadcn/ui
├── React Router v6
└── Recharts (analytics)
```

### Backend (Django + FastAPI Hybrid)
```
├── Django 5.0 (admin, auth, ORM)
├── Django REST Framework
├── FastAPI (async AI endpoints)
├── Celery (background tasks)
├── PostgreSQL (main DB)
├── Redis (cache + queue)
└── MinIO/S3 (file storage)
```

### AI & Document Generation
```
├── OpenAI GPT-4 / Gemini
├── Whisper (voice transcription)
├── python-docx (Word generation)
├── LangChain (AI orchestration)
└── Vector DB (Pinecone/Weaviate)
```

### Infrastructure
```
├── Docker + Kubernetes
├── Nginx (reverse proxy)
├── Cloudflare (CDN + security)
├── Stripe (payments)
└── Sentry (error tracking)
```

---

## 📊 Database Schema

### Core Tables

```sql
-- Organizations (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(100) UNIQUE,
    plan VARCHAR(50), -- free, pro, enterprise
    subscription_status VARCHAR(50),
    documents_quota INTEGER,
    documents_used INTEGER,
    created_at TIMESTAMP,
    settings JSONB
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50), -- owner, admin, editor, viewer
    telegram_id BIGINT UNIQUE,
    is_active BOOLEAN,
    created_at TIMESTAMP
);

-- Document Templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255),
    category VARCHAR(100),
    template_text TEXT,
    ai_prompt TEXT,
    required_fields JSONB,
    is_public BOOLEAN,
    usage_count INTEGER,
    created_at TIMESTAMP
);

-- Generated Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    template_id UUID REFERENCES document_templates(id),
    conversation_id UUID,
    status VARCHAR(50), -- draft, processing, completed, failed
    document_type VARCHAR(100),
    input_data JSONB,
    generated_text TEXT,
    file_url VARCHAR(500),
    created_at TIMESTAMP,
    metadata JSONB
);

-- Conversations (AI dialogue history)
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    source VARCHAR(50), -- telegram, web, api
    status VARCHAR(50),
    messages JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(50),
    status VARCHAR(50),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN
);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255),
    key_hash VARCHAR(255),
    prefix VARCHAR(20),
    permissions JSONB,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

---

## 🎨 Frontend Architecture

### Folder Structure
```
frontend/
├── src/
│   ├── app/                      # App initialization
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/
│   ├── features/                 # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── store/
│   │   ├── documents/
│   │   │   ├── components/
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── DocumentEditor.tsx
│   │   │   │   └── AIAssistant.tsx
│   │   │   ├── hooks/
│   │   │   └── api/
│   │   ├── templates/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── billing/
│   ├── components/               # Shared components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layouts/
│   │   └── common/
│   ├── lib/                      # Utilities
│   │   ├── api-client.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/                    # TypeScript types
├── public/
└── package.json
```

### Key Features Implementation

#### 1. Multi-tenant Organization Selector
```typescript
// src/features/organizations/components/OrgSwitcher.tsx
export const OrgSwitcher = () => {
  const { currentOrg, organizations, switchOrg } = useOrganizations();
  
  return (
    <Select value={currentOrg?.id} onValueChange={switchOrg}>
      {organizations.map(org => (
        <SelectItem key={org.id} value={org.id}>
          {org.name}
        </SelectItem>
      ))}
    </Select>
  );
};
```

#### 2. AI Document Generator Component
```typescript
// src/features/documents/components/AIDocumentGenerator.tsx
export const AIDocumentGenerator = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { generateDocument } = useDocumentGeneration();
  
  const handleMessage = async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Get AI response
    const aiResponse = await generateDocument({ messages, text });
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
  };
  
  return <ChatInterface messages={messages} onSend={handleMessage} />;
};
```

#### 3. Template Library
```typescript
// src/features/templates/components/TemplateGallery.tsx
export const TemplateGallery = () => {
  const { templates } = useTemplates();
  const { createDocumentFromTemplate } = useDocuments();
  
  return (
    <Grid>
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onUse={() => createDocumentFromTemplate(template.id)}
        />
      ))}
    </Grid>
  );
};
```

---

## 🔧 Backend Architecture

### Django Project Structure
```
backend/
├── config/                       # Django settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── organizations/            # Multi-tenant
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── middleware.py
│   ├── documents/                # Document CRUD
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── tasks.py              # Celery tasks
│   │   └── api/
│   ├── templates/                # Template management
│   ├── ai_services/              # AI integrations
│   │   ├── openai_client.py
│   │   ├── gemini_client.py
│   │   └── document_generator.py
│   ├── telegram_bot/             # Telegram integration
│   │   ├── bot.py
│   │   ├── handlers.py
│   │   └── webhooks.py
│   ├── billing/                  # Stripe integration
│   │   ├── models.py
│   │   ├── stripe_client.py
│   │   └── webhooks.py
│   └── analytics/                # Usage tracking
├── fastapi_app/                  # FastAPI for async AI
│   ├── main.py
│   ├── routes/
│   │   ├── ai_chat.py
│   │   └── document_generation.py
│   └── services/
└── manage.py
```

### Key Backend Components

#### 1. Multi-tenant Middleware
```python
# apps/organizations/middleware.py
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Extract organization from subdomain or header
        org_slug = self.get_organization_slug(request)
        request.organization = Organization.objects.get(slug=org_slug)
        
        # Apply tenant filter to all queries
        with tenant_context(request.organization):
            response = self.get_response(request)
        
        return response
```

#### 2. Document Generation Service
```python
# apps/ai_services/document_generator.py
class DocumentGenerationService:
    def __init__(self, organization):
        self.organization = organization
        self.ai_client = get_ai_client(organization.ai_provider)
    
    async def generate_document(self, template, user_input):
        # 1. AI dialogue to collect data
        conversation = await self.conduct_dialogue(template, user_input)
        
        # 2. Generate document text
        document_text = await self.ai_client.generate_text(
            template=template,
            data=conversation.collected_data
        )
        
        # 3. Create Word file
        word_file = self.create_word_document(document_text, template)
        
        # 4. Save to DB
        document = Document.objects.create(
            organization=self.organization,
            template=template,
            generated_text=document_text,
            file=word_file
        )
        
        return document
```

#### 3. Celery Tasks
```python
# apps/documents/tasks.py
@shared_task
def generate_document_async(document_id):
    document = Document.objects.get(id=document_id)
    service = DocumentGenerationService(document.organization)
    
    try:
        document.status = 'processing'
        document.save()
        
        result = service.generate_document(
            template=document.template,
            user_input=document.input_data
        )
        
        document.status = 'completed'
        document.file = result.file
        document.save()
        
        # Send notification
        send_document_ready_notification(document)
        
    except Exception as e:
        document.status = 'failed'
        document.error_message = str(e)
        document.save()
```

#### 4. Stripe Billing Integration
```python
# apps/billing/stripe_client.py
class StripeService:
    def create_checkout_session(self, organization, plan):
        session = stripe.checkout.Session.create(
            customer_email=organization.owner.email,
            payment_method_types=['card'],
            line_items=[{
                'price': settings.STRIPE_PRICES[plan],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{settings.FRONTEND_URL}/billing/success',
            cancel_url=f'{settings.FRONTEND_URL}/billing/cancel',
            metadata={
                'organization_id': str(organization.id),
                'plan': plan
            }
        )
        return session
    
    def handle_webhook(self, event):
        if event.type == 'checkout.session.completed':
            self.handle_subscription_created(event.data.object)
        elif event.type == 'invoice.payment_failed':
            self.handle_payment_failed(event.data.object)
```

---

## 🔐 Security Best Practices

### 1. Authentication & Authorization
```python
# JWT tokens with refresh mechanism
# Row-level security (RLS) for multi-tenancy
# API rate limiting per organization
# RBAC (Role-Based Access Control)
```

### 2. Data Isolation
```python
# Each organization's data is completely isolated
# Middleware enforces tenant context
# Database indexes on organization_id
```

### 3. API Security
```python
# CORS configuration
# API key authentication
# Request signing for webhooks
# Input validation & sanitization
```

---

## 📦 Deployment Architecture

### Docker Compose (Development)
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
  
  fastapi:
    build: ./backend
    command: uvicorn fastapi_app.main:app
    ports: ["8001:8000"]
  
  celery:
    build: ./backend
    command: celery -A config worker
  
  postgres:
    image: postgres:16
    volumes: [postgres_data:/var/lib/postgresql/data]
  
  redis:
    image: redis:7-alpine
```

### Kubernetes (Production)
```
- Horizontal Pod Autoscaling (HPA)
- Ingress with SSL (cert-manager)
- StatefulSet for PostgreSQL
- Separate services for FastAPI/Django/Celery
```

---

## 💰 Monetization Strategy

### Pricing Tiers

#### Free Tier
- 10 documents/month
- Basic templates
- Community support
- Telegram bot access

#### Pro Tier ($29/mo)
- 500 documents/month
- All templates
- Priority support
- Custom branding
- API access
- Team members (5)

#### Enterprise Tier (Custom)
- Unlimited documents
- Custom templates
- Dedicated support
- On-premise deployment
- SLA guarantee
- Unlimited team members

---

## 📈 Analytics & Monitoring

### Key Metrics to Track
```typescript
interface OrganizationMetrics {
  documentsGenerated: number;
  activeUsers: number;
  apiCallsCount: number;
  averageGenerationTime: number;
  templateUsage: Record<string, number>;
  costPerDocument: number;
  churnRate: number;
}
```

### Tools
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Grafana** - Infrastructure monitoring
- **Mixpanel** - User behavior

---

## 🚀 MVP Development Roadmap

### Phase 1: Core Platform (4-6 weeks)
- [ ] Multi-tenant architecture
- [ ] User authentication
- [ ] Basic document generation
- [ ] 5 essential templates
- [ ] Telegram bot integration

### Phase 2: SaaS Features (4 weeks)
- [ ] Billing integration (Stripe)
- [ ] Subscription management
- [ ] Usage tracking & quotas
- [ ] Admin dashboard
- [ ] Email notifications

### Phase 3: Advanced Features (6 weeks)
- [ ] Custom templates editor
- [ ] API access
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] Document versioning

### Phase 4: Scale & Optimize (Ongoing)
- [ ] Performance optimization
- [ ] Kubernetes deployment
- [ ] Load testing
- [ ] Security audit
- [ ] Marketing website

---

## 🎯 Success Criteria

### Technical
- ✅ 99.9% uptime SLA
- ✅ <2s document generation time
- ✅ Support 1000+ concurrent users
- ✅ GDPR compliant

### Business
- ✅ 1000 paying customers in 6 months
- ✅ <5% monthly churn rate
- ✅ $50k MRR target
- ✅ 4.5+ app store rating

---

**Next Steps**: Начнем с создания базовой структуры проекта и реализации core features! 🚀