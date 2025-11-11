from django.contrib import admin
from .models import Organization, Subscription, APIKey


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'slug', 'plan', 'subscription_status',
        'bots_used', 'bots_quota',
        'documents_used', 'documents_quota',
        'created_at'
    ]
    list_filter = ['plan', 'subscription_status', 'created_at']
    search_fields = ['name', 'slug', 'stripe_customer_id']
    readonly_fields = [
        'id', 'created_at', 'updated_at',
        'stripe_customer_id', 'stripe_subscription_id'
    ]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'name', 'slug')
        }),
        ('Subscription', {
            'fields': (
                'plan', 'subscription_status',
                'trial_ends_at',
                'stripe_customer_id',
                'stripe_subscription_id'
            )
        }),
        ('Quotas', {
            'fields': (
                ('bots_quota', 'bots_used'),
                ('documents_quota', 'documents_used'),
                ('api_calls_quota', 'api_calls_used'),
            )
        }),
        ('Settings', {
            'fields': ('settings',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related()
    
    actions = ['reset_monthly_usage']
    
    @admin.action(description='Reset monthly usage counters')
    def reset_monthly_usage(self, request, queryset):
        for org in queryset:
            org.reset_monthly_usage()
        self.message_user(
            request,
            f'Reset usage for {queryset.count()} organizations'
        )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'organization', 'plan', 'status',
        'current_period_start', 'current_period_end',
        'cancel_at_period_end'
    ]
    list_filter = ['plan', 'status', 'cancel_at_period_end']
    search_fields = [
        'organization__name',
        'stripe_subscription_id'
    ]
    readonly_fields = [
        'id', 'stripe_subscription_id', 'stripe_price_id',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Organization', {
            'fields': ('organization',)
        }),
        ('Stripe Details', {
            'fields': ('stripe_subscription_id', 'stripe_price_id')
        }),
        ('Plan', {
            'fields': ('plan', 'status')
        }),
        ('Billing Period', {
            'fields': (
                'current_period_start',
                'current_period_end'
            )
        }),
        ('Cancellation', {
            'fields': ('cancel_at_period_end', 'canceled_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'organization', 'prefix',
        'is_active', 'usage_count',
        'last_used_at', 'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'organization__name', 'prefix']
    readonly_fields = [
        'id', 'prefix', 'key_hash',
        'last_used_at', 'usage_count',
        'created_at'
    ]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'organization', 'name')
        }),
        ('Key Details', {
            'fields': ('prefix', 'key_hash'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('permissions',)
        }),
        ('Status', {
            'fields': ('is_active', 'expires_at')
        }),
        ('Usage', {
            'fields': ('usage_count', 'last_used_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # API keys should be generated via API/UI, not admin
        return False
