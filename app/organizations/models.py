"""
Organizations app - Multi-tenant SaaS foundation
Handles organizations, subscriptions, API keys, and usage quotas
"""
import uuid
import secrets
import hashlib
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta


class PlanChoices(models.TextChoices):
    """Subscription plan types"""
    FREE = 'free', 'Free'
    PRO = 'pro', 'Pro'
    ENTERPRISE = 'enterprise', 'Enterprise'


class SubscriptionStatus(models.TextChoices):
    """Subscription statuses"""
    ACTIVE = 'active', 'Active'
    TRIALING = 'trialing', 'Trialing'
    PAST_DUE = 'past_due', 'Past Due'
    CANCELED = 'canceled', 'Canceled'
    INCOMPLETE = 'incomplete', 'Incomplete'


class Organization(models.Model):
    """
    Multi-tenant organization model
    Each organization is a separate customer with isolated data
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, verbose_name='Organization Name')
    slug = models.SlugField(
        max_length=100,
        unique=True,
        blank=True,
        verbose_name='URL Slug'
    )
    
    # Plan & Subscription
    plan = models.CharField(
        max_length=50,
        choices=PlanChoices.choices,
        default=PlanChoices.FREE,
        verbose_name='Subscription Plan'
    )
    subscription_status = models.CharField(
        max_length=50,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
        verbose_name='Subscription Status'
    )
    
    # Quotas
    bots_quota = models.IntegerField(default=1, verbose_name='Bots Limit')
    bots_used = models.IntegerField(default=0, verbose_name='Bots Used')
    
    documents_quota = models.IntegerField(
        default=10,
        verbose_name='Monthly Documents Limit'
    )
    documents_used = models.IntegerField(
        default=0,
        verbose_name='Documents Used This Month'
    )
    
    api_calls_quota = models.IntegerField(
        default=0,
        verbose_name='Monthly API Calls Limit'
    )
    api_calls_used = models.IntegerField(
        default=0,
        verbose_name='API Calls Used This Month'
    )
    
    # Stripe integration
    stripe_customer_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Stripe Customer ID'
    )
    stripe_subscription_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Stripe Subscription ID'
    )
    
    # Settings
    settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Organization Settings',
        help_text='Custom settings for branding, AI preferences, etc.'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Trial
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'organizations'
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['plan']),
            models.Index(fields=['subscription_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.plan})"
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            # Ensure unique slug
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    @property
    def is_trial(self):
        """Check if organization is in trial period"""
        if not self.trial_ends_at:
            return False
        return timezone.now() < self.trial_ends_at
    
    @property
    def can_create_bot(self):
        """Check if organization can create more bots"""
        return self.bots_used < self.bots_quota
    
    @property
    def can_generate_document(self):
        """Check if organization has document quota"""
        return self.documents_used < self.documents_quota
    
    @property
    def can_use_api(self):
        """Check if organization can make API calls"""
        if self.api_calls_quota == 0:  # Unlimited
            return True
        return self.api_calls_used < self.api_calls_quota
    
    def reset_monthly_usage(self):
        """Reset monthly usage counters"""
        self.documents_used = 0
        self.api_calls_used = 0
        self.save(update_fields=['documents_used', 'api_calls_used'])
    
    def increment_usage(self, usage_type: str):
        """Increment usage counter"""
        if usage_type == 'document':
            self.documents_used += 1
            self.save(update_fields=['documents_used'])
        elif usage_type == 'api_call':
            self.api_calls_used += 1
            self.save(update_fields=['api_calls_used'])
        elif usage_type == 'bot':
            self.bots_used += 1
            self.save(update_fields=['bots_used'])


class Subscription(models.Model):
    """
    Subscription history and details
    Linked to Stripe subscriptions
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    
    # Stripe details
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    stripe_price_id = models.CharField(max_length=255)
    
    # Plan details
    plan = models.CharField(max_length=50, choices=PlanChoices.choices)
    status = models.CharField(max_length=50, choices=SubscriptionStatus.choices)
    
    # Billing period
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    
    # Cancellation
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['stripe_subscription_id']),
        ]
    
    def __str__(self):
        return f"{self.organization.name} - {self.plan} ({self.status})"


class APIKey(models.Model):
    """
    API keys for external integrations
    Allows organizations to use the platform API
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='api_keys'
    )
    
    # Key details
    name = models.CharField(max_length=255, verbose_name='Key Name')
    prefix = models.CharField(max_length=20, editable=False, verbose_name='Key Prefix')
    key_hash = models.CharField(max_length=255, editable=False, verbose_name='Key Hash')
    
    # Permissions
    permissions = models.JSONField(
        default=dict,
        verbose_name='Permissions',
        help_text='Allowed actions: generate_document, manage_bots, etc.'
    )
    
    # Usage tracking
    last_used_at = models.DateTimeField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'api_keys'
        verbose_name = 'API Key'
        verbose_name_plural = 'API Keys'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['prefix']),
        ]
    
    def __str__(self):
        return f"{self.organization.name} - {self.name} ({self.prefix}***)"
    
    @classmethod
    def generate_key(cls, organization, name, permissions=None):
        """Generate a new API key"""
        # Generate random key
        raw_key = secrets.token_urlsafe(32)
        prefix = raw_key[:8]
        
        # Hash the key for storage
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        # Create API key record
        api_key = cls.objects.create(
            organization=organization,
            name=name,
            prefix=prefix,
            key_hash=key_hash,
            permissions=permissions or {}
        )
        
        # Return the raw key (only time it's visible)
        return api_key, raw_key
    
    @classmethod
    def verify_key(cls, raw_key):
        """Verify an API key and return the organization"""
        prefix = raw_key[:8]
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        try:
            api_key = cls.objects.select_related('organization').get(
                prefix=prefix,
                key_hash=key_hash,
                is_active=True
            )
            
            # Check expiration
            if api_key.expires_at and timezone.now() > api_key.expires_at:
                return None
            
            # Update usage
            api_key.last_used_at = timezone.now()
            api_key.usage_count += 1
            api_key.save(update_fields=['last_used_at', 'usage_count'])
            
            return api_key
            
        except cls.DoesNotExist:
            return None
    
    def has_permission(self, action: str) -> bool:
        """Check if key has permission for action"""
        if not self.permissions:
            return False
        return self.permissions.get(action, False)


# Plan quotas configuration
PLAN_QUOTAS = {
    PlanChoices.FREE: {
        'bots': 1,
        'documents': 10,
        'api_calls': 0,  # No API access on free
        'team_members': 1,
        'custom_templates': False,
        'analytics': False,
        'priority_support': False,
    },
    PlanChoices.PRO: {
        'bots': 5,
        'documents': 500,
        'api_calls': 1000,
        'team_members': 5,
        'custom_templates': True,
        'analytics': True,
        'priority_support': True,
    },
    PlanChoices.ENTERPRISE: {
        'bots': 999,  # Unlimited
        'documents': 10000,
        'api_calls': 0,  # Unlimited
        'team_members': 999,  # Unlimited
        'custom_templates': True,
        'analytics': True,
        'priority_support': True,
        'white_label': True,
        'on_premise': True,
    },
}
