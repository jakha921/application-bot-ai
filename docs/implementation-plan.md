# 🎯 План реализации Document AI Platform

## Анализ текущего кода

### ✅ Что уже есть (из ваших репозиториев):

#### Backend (`application-bot-ai`)
- ✅ Django + aiogram структура
- ✅ AI сервисы (OpenAI/Gemini)
- ✅ Telegram bot интеграция
- ✅ Document generation (python-docx)
- ✅ PostgreSQL модели
- ✅ Redis FSM storage

#### Frontend (`chatbot-ai`)
- ✅ React + TypeScript
- ✅ Zustand state management
- ✅ Tailwind CSS + современный UI
- ✅ Multi-bot management
- ✅ User management
- ✅ Chat interface

### 🔄 Что нужно добавить для SaaS:

1. **Multi-tenancy** (организации)
2. **Billing & Subscriptions** (Stripe)
3. **API для внешних интеграций**
4. **Template marketplace**
5. **Analytics dashboard**
6. **Team collaboration**
7. **Usage quotas & limits**

---

## 📋 Пошаговый план реализации

### Неделя 1-2: Foundation & Multi-tenancy

#### Backend Tasks
```python
# 1. Добавить модель Organization
# apps/core/models.py
class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    plan = models.CharField(max_length=50, choices=PLAN_CHOICES, default='free')
    documents_quota = models.IntegerField(default=10)
    documents_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    settings = models.JSONField(default=dict)
    
    # Stripe integration
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)

# 2. Обновить TelegramUser
class TelegramUser(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    # ... existing fields

# 3. Middleware для tenant context
# apps/core/middleware.py
class TenantMiddleware:
    """Adds organization context to all requests"""
    def process_request(self, request):
        # Get org from subdomain, header, or JWT token
        org = self.get_organization(request)
        request.organization = org
```

#### Frontend Tasks
```typescript
// 1. Добавить Organization context
// src/contexts/OrganizationContext.tsx
interface OrganizationContextValue {
  currentOrg: Organization | null;
  organizations: Organization[];
  switchOrg: (orgId: string) => void;
  createOrg: (name: string) => Promise<Organization>;
}

// 2. Обновить API client
// src/lib/api-client.ts
class APIClient {
  private baseURL: string;
  private orgId: string | null;
  
  setOrganization(orgId: string) {
    this.orgId = orgId;
    // All requests will include org context
  }
}

// 3. Protected routes with org check
// src/app/Router.tsx
<Route
  path="/dashboard"
  element={<RequireOrg><Dashboard /></RequireOrg>}
/>
```

### Неделя 3-4: Billing & Subscriptions

#### Backend
```python
# apps/billing/stripe_service.py
class StripeService:
    def create_checkout_session(self, org: Organization, plan: str):
        """Create Stripe checkout for subscription"""
        session = stripe.checkout.Session.create(...)
        return session.url
    
    def handle_webhook(self, event):
        """Process Stripe webhooks"""
        if event.type == 'checkout.session.completed':
            self.activate_subscription(event.data.object)

# apps/billing/views.py
class SubscriptionViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def create_checkout(self, request):
        org = request.organization
        plan = request.data.get('plan')
        
        checkout_url = StripeService().create_checkout_session(org, plan)
        return Response({'url': checkout_url})
    
    @action(detail=False, methods=['post'])
    def cancel_subscription(self, request):
        # Cancel Stripe subscription
        pass

# apps/core/decorators.py
def check_quota(func):
    """Decorator to check if org has quota"""
    def wrapper(request, *args, **kwargs):
        org = request.organization
        if org.documents_used >= org.documents_quota:
            raise QuotaExceeded("Document limit reached")
        return func(request, *args, **kwargs)
    return wrapper
```

#### Frontend
```typescript
// src/features/billing/components/PricingTable.tsx
export const PricingTable = () => {
  const { createCheckout } = useBilling();
  
  const plans = [
    {
      name: 'Free',
      price: 0,
      documents: 10,
      features: ['Basic templates', 'Telegram bot']
    },
    {
      name: 'Pro',
      price: 29,
      documents: 500,
      features: ['All templates', 'API access', 'Priority support']
    }
  ];
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {plans.map(plan => (
        <PlanCard
          key={plan.name}
          plan={plan}
          onSelect={() => createCheckout(plan.name)}
        />
      ))}
    </div>
  );
};

// src/features/billing/components/UsageWidget.tsx
export const UsageWidget = () => {
  const { organization } = useOrganization();
  
  const percentage = (organization.documents_used / organization.documents_quota) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} />
        <p className="text-sm text-muted-foreground mt-2">
          {organization.documents_used} / {organization.documents_quota} documents used
        </p>
        {percentage > 80 && (
          <Alert className="mt-4">
            <AlertDescription>
              You're running low on documents. <Link to="/billing">Upgrade now</Link>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

### Неделя 5-6: Template Marketplace

#### Backend
```python
# apps/templates/models.py
class DocumentTemplate(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField()
    
    # Template content
    template_text = models.TextField()
    ai_prompt = models.TextField()
    required_fields = models.JSONField()
    
    # Visibility
    is_public = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    
    # Analytics
    usage_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

# apps/templates/views.py
class TemplateViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        org = self.request.organization
        
        # Show public templates + org's private templates
        return DocumentTemplate.objects.filter(
            Q(is_public=True) | Q(organization=org)
        )
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        template = self.get_object()
        
        # Create conversation with this template
        conversation = Conversation.objects.create(
            organization=request.organization,
            user=request.user,
            template=template
        )
        
        # Start AI dialogue
        # ...
        
        return Response({'conversation_id': conversation.id})
```

#### Frontend
```typescript
// src/features/templates/components/TemplateGallery.tsx
export const TemplateGallery = () => {
  const { data: templates } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const filteredTemplates = templates?.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CategoryFilter
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
        <Button onClick={onCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates?.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() => useTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  );
};

// src/features/templates/components/TemplateEditor.tsx
export const TemplateEditor = () => {
  const { createTemplate, updateTemplate } = useTemplates();
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: '',
    description: '',
    template_text: '',
    ai_prompt: '',
    required_fields: []
  });
  
  const handleSubmit = async () => {
    await createTemplate(formData);
    // Navigate to template list
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <FormField name="name" label="Template Name" />
      <FormField name="category" label="Category" />
      <FormField name="description" label="Description" type="textarea" />
      
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Template Content</TabsTrigger>
          <TabsTrigger value="ai">AI Prompt</TabsTrigger>
          <TabsTrigger value="fields">Required Fields</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <MarkdownEditor
            value={formData.template_text}
            onChange={text => setFormData({...formData, template_text: text})}
          />
        </TabsContent>
        
        <TabsContent value="ai">
          <Textarea
            value={formData.ai_prompt}
            onChange={e => setFormData({...formData, ai_prompt: e.target.value})}
            rows={10}
          />
        </TabsContent>
        
        <TabsContent value="fields">
          <FieldsEditor
            fields={formData.required_fields}
            onChange={fields => setFormData({...formData, required_fields: fields})}
          />
        </TabsContent>
      </Tabs>
      
      <Button type="submit">Save Template</Button>
    </Form>
  );
};
```

### Неделя 7-8: Analytics & API Access

#### Backend
```python
# apps/analytics/services.py
class AnalyticsService:
    def get_organization_metrics(self, org: Organization, period: str = '30d'):
        """Calculate org usage metrics"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=int(period.replace('d', '')))
        
        documents = Document.objects.filter(
            organization=org,
            created_at__range=[start_date, end_date]
        )
        
        return {
            'total_documents': documents.count(),
            'documents_by_template': documents.values('template__name').annotate(
                count=Count('id')
            ),
            'documents_by_day': documents.extra({
                'day': "DATE(created_at)"
            }).values('day').annotate(count=Count('id')),
            'average_generation_time': documents.aggregate(
                avg=Avg('generation_time')
            )['avg'],
            'success_rate': documents.filter(
                status='completed'
            ).count() / documents.count() * 100
        }

# apps/api/views.py (Public API for customers)
class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return None
        
        # Verify API key
        key_obj = APIKey.objects.filter(
            key_hash=hash_api_key(api_key),
            is_active=True
        ).first()
        
        if not key_obj:
            raise AuthenticationFailed('Invalid API key')
        
        return (key_obj.organization, None)

class DocumentGenerationAPIView(APIView):
    authentication_classes = [APIKeyAuthentication]
    
    @check_quota
    def post(self, request):
        """
        Generate document via API
        
        POST /api/v1/documents/generate
        {
          "template_id": "uuid",
          "input_data": {...}
        }
        """
        template_id = request.data.get('template_id')
        input_data = request.data.get('input_data')
        
        # Create document generation task
        task = generate_document_async.delay(
            organization_id=request.organization.id,
            template_id=template_id,
            input_data=input_data
        )
        
        return Response({
            'task_id': task.id,
            'status': 'processing'
        })
```

#### Frontend
```typescript
// src/features/analytics/components/AnalyticsDashboard.tsx
export const AnalyticsDashboard = () => {
  const { data: metrics } = useAnalytics({ period: '30d' });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Documents"
          value={metrics?.total_documents}
          icon={FileText}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics?.success_rate}%`}
          icon={CheckCircle}
        />
        <MetricCard
          title="Avg Generation Time"
          value={`${metrics?.average_generation_time}s`}
          icon={Clock}
        />
        <MetricCard
          title="Active Users"
          value={metrics?.active_users}
          icon={Users}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Documents Generated</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics?.documents_by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Popular Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.documents_by_template}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="template__name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// src/features/api-keys/components/APIKeysManager.tsx
export const APIKeysManager = () => {
  const { data: apiKeys, createKey, revokeKey } = useAPIKeys();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Use API keys to integrate Document AI into your applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys?.map(key => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>
                    <code>{key.prefix}...</code>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>{formatDate(key.created_at)}</TableCell>
                  <TableCell>
                    {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 🚀 Следующие шаги

### 1. Немедленные действия (эта неделя)
```bash
# Clone ваши репозитории
git clone https://github.com/jakha921/application-bot-ai.git backend
git clone https://github.com/jakha921/chatbot-ai.git frontend

# Создать новую ветку для SaaS features
cd backend && git checkout -b feature/saas-platform
cd frontend && git checkout -b feature/saas-platform

# Установить зависимости
cd backend && pip install stripe celery
cd frontend && npm install @stripe/stripe-js recharts
```

### 2. Приоритетные задачи
1. **Создать модель Organization** в backend
2. **Добавить OrganizationContext** в frontend
3. **Интегрировать Stripe** для billing
4. **Создать TemplateViewSet** для шаблонов
5. **Добавить Analytics dashboard** во frontend

### 3. Тестирование
```bash
# Backend tests
pytest apps/core/tests/test_multi_tenancy.py
pytest apps/billing/tests/test_stripe.py

# Frontend tests
npm run test
npm run test:e2e
```

---

## 📚 Документация

Создайте файлы:
- `docs/API.md` - API документация для клиентов
- `docs/DEPLOYMENT.md` - инструкции по деплою
- `docs/ARCHITECTURE.md` - архитектура системы
- `docs/CONTRIBUTING.md` - для разработчиков

---

**Готов начать кодить! С чего начнём?** 🚀

Предлагаю:
1. Сначала добавить Organization модель в backend
2. Затем интегрировать Stripe
3. Потом обновить frontend с OrganizationContext

Что скажете?