"""
Core models for Ariza AI Bot
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class RoleChoices(models.TextChoices):
    """User roles within an organization"""
    OWNER = 'owner', 'Owner'
    ADMIN = 'admin', 'Admin'
    EDITOR = 'editor', 'Editor'
    VIEWER = 'viewer', 'Viewer'


class UserProfile(models.Model):
    """Profile linking Django User to Organization"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='user_profiles'
    )
    role = models.CharField(
        max_length=50,
        choices=RoleChoices.choices,
        default=RoleChoices.VIEWER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_profiles'
        unique_together = ['user', 'organization']
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission"""
        permissions_map = {
            'owner': ['manage_org', 'manage_users', 'manage_bots',
                      'manage_templates', 'view_analytics'],
            'admin': ['manage_users', 'manage_bots',
                      'manage_templates', 'view_analytics'],
            'editor': ['manage_bots', 'manage_templates'],
            'viewer': ['view_analytics'],
        }
        return permission in permissions_map.get(self.role, [])
    
    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"


class TelegramUser(models.Model):
    """Telegram user model with multi-tenant support"""
    # Organization relationship
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='telegram_users',
        null=True,  # Temporary for migration
        blank=True
    )
    
    # Role in organization
    role = models.CharField(
        max_length=50,
        choices=RoleChoices.choices,
        default=RoleChoices.VIEWER,
        verbose_name='User Role'
    )
    
    # Telegram details
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    language_code = models.CharField(max_length=10, null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'telegram_users'
        verbose_name = 'Telegram User'
        verbose_name_plural = 'Telegram Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
        ]
    
    def __str__(self):
        org_name = self.organization.name if self.organization else 'No Org'
        return f"{self.full_name} (@{self.username}) - {org_name}"
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    
    def has_permission(self, action: str) -> bool:
        """Check if user has permission for action"""
        permissions = {
            RoleChoices.OWNER: ['*'],  # All permissions
            RoleChoices.ADMIN: [
                'manage_bots', 'manage_users', 'view_analytics',
                'generate_document', 'manage_templates'
            ],
            RoleChoices.EDITOR: [
                'generate_document', 'view_templates'
            ],
            RoleChoices.VIEWER: [
                'view_documents', 'view_templates'
            ],
        }
        
        role_perms = permissions.get(self.role, [])
        return '*' in role_perms or action in role_perms


class Conversation(models.Model):
    """Conversation session with user"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Organization relationship (for multi-tenancy)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,  # Temporary for migration
        blank=True
    )
    
    user = models.ForeignKey(
        TelegramUser,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    document_type = models.CharField(max_length=100, null=True, blank=True)
    is_document_ready = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'conversations'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Conversation {self.id} - {self.user.full_name} ({self.status})"
    
    def mark_completed(self):
        """Mark conversation as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


class Message(models.Model):
    """Message in conversation"""
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('voice', 'Voice'),
        ('system', 'System'),
    ]
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default='text'
    )
    content = models.TextField()
    voice_file_id = models.CharField(max_length=255, null=True, blank=True)
    transcription = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class Document(models.Model):
    """Generated document"""
    # Organization relationship (for multi-tenancy)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='documents',
        null=True,  # Temporary for migration
        blank=True
    )
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    document_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'documents'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Document {self.filename}"


class Statistics(models.Model):
    """Daily statistics"""
    date = models.DateField(unique=True, db_index=True)
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    total_conversations = models.IntegerField(default=0)
    completed_conversations = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    voice_messages = models.IntegerField(default=0)
    documents_generated = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'statistics'
        verbose_name = 'Statistics'
        verbose_name_plural = 'Statistics'
        ordering = ['-date']
    
    def __str__(self):
        return f"Stats for {self.date}"
