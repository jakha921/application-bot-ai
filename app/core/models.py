"""
Core models for Ariza AI Bot
"""
from django.db import models
from django.utils import timezone


class TelegramUser(models.Model):
    """Telegram user model"""
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    language_code = models.CharField(max_length=10, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'telegram_users'
        verbose_name = 'Telegram User'
        verbose_name_plural = 'Telegram Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name or ''} {self.last_name or ''} (@{self.username})"
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name or ''} {self.last_name or ''}".strip()


class Conversation(models.Model):
    """Conversation session with user"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
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
