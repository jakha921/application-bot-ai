"""
Core models for Bot Factory Platform
"""
import uuid
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


class OrganizationInvite(models.Model):
    """Invitation for users to join organizations"""
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='invites'
    )
    email = models.EmailField(verbose_name='Email Address')
    role = models.CharField(
        max_length=50,
        choices=RoleChoices.choices,
        default=RoleChoices.VIEWER,
        verbose_name='Role'
    )
    token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='Invite Token'
    )
    is_accepted = models.BooleanField(
        default=False,
        verbose_name='Is Accepted'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Expiration Date'
    )
    
    class Meta:
        db_table = 'organization_invites'
        verbose_name = 'Organization Invite'
        verbose_name_plural = 'Organization Invites'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invite for {self.email} to {self.organization.name}"
    
    def is_expired(self):
        """Check if invite is expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


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


class Bot(models.Model):
    """AI Bot configuration for multi-purpose chatbots"""
    BOT_TYPE_CHOICES = [
        ('chatbot', 'Chatbot'),
        ('assistant', 'Assistant'),
        ('custom', 'Custom'),
    ]
    
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='bots'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Bot Name',
        help_text='Display name for the bot (3-100 characters)'
    )
    description = models.TextField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name='Description',
        help_text='Optional description of bot purpose'
    )
    telegram_token = models.CharField(
        max_length=255,
        verbose_name='Telegram Bot Token',
        help_text='Bot token from @BotFather'
    )
    system_prompt = models.TextField(
        null=True,
        blank=True,
        verbose_name='System Prompt',
        help_text='Main instructions/role for the bot (e.g., "You are a sales assistant...")'
    )
    bot_type = models.CharField(
        max_length=50,
        choices=BOT_TYPE_CHOICES,
        default='chatbot',
        verbose_name='Bot Type',
        help_text='Type of bot functionality'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active',
        help_text='Whether the bot is currently active'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bots'
        verbose_name = 'Bot'
        verbose_name_plural = 'Bots'
        ordering = ['-created_at']
        unique_together = ['organization', 'telegram_token']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class KnowledgeBaseFile(models.Model):
    """Knowledge base file/content for RAG (Retrieval-Augmented Generation)"""
    FILE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('url', 'URL'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('error', 'Error'),
    ]
    
    bot = models.ForeignKey(
        Bot,
        on_delete=models.CASCADE,
        related_name='knowledge_files',
        verbose_name='Bot',
        null=True,  # Allow null for migration compatibility
        blank=True
    )
    name = models.CharField(
        max_length=200,
        verbose_name='File Name',
        help_text='Name of the knowledge base file'
    )
    file = models.FileField(
        upload_to='knowledge_base/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='File',
        help_text='Upload PDF/DOCX file'
    )
    content = models.TextField(
        null=True,
        blank=True,
        verbose_name='Content',
        help_text='Text content or extracted text from file'
    )
    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPE_CHOICES,
        default='text',
        verbose_name='File Type'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Processing Status'
    )
    
    # Metadata
    file_size = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name='File Size (bytes)'
    )
    processing_error = models.TextField(
        null=True,
        blank=True,
        verbose_name='Processing Error'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Processed At'
    )
    
    class Meta:
        db_table = 'knowledge_base_files'
        verbose_name = 'Knowledge Base File'
        verbose_name_plural = 'Knowledge Base Files'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['bot', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.file_type}) - {self.bot.name}"
    
    def mark_ready(self):
        """Mark file as ready after processing"""
        self.status = 'ready'
        self.processed_at = timezone.now()
        self.save()
    
    def mark_error(self, error_message: str):
        """Mark file as error with message"""
        self.status = 'error'
        self.processing_error = error_message
        self.processed_at = timezone.now()
        self.save()


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
