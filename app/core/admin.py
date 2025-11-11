"""
Admin configuration for core models
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    TelegramUser, Conversation, Message, Statistics,
    Bot, KnowledgeBaseFile, OrganizationInvite
)


@admin.register(TelegramUser)
class TelegramUserAdmin(admin.ModelAdmin):
    list_display = [
        'telegram_id', 'full_name', 'username', 'is_active',
        'is_blocked', 'created_at'
    ]
    list_filter = ['is_active', 'is_blocked', 'created_at']
    search_fields = ['telegram_id', 'username', 'first_name', 'last_name']
    readonly_fields = ['telegram_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Telegram Info', {
            'fields': ('telegram_id', 'username', 'first_name', 'last_name')
        }),
        ('Status', {
            'fields': ('is_active', 'is_blocked', 'language_code')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['role', 'message_type', 'content', 'created_at']
    can_delete = False
    max_num = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'status', 'started_at'
    ]
    list_filter = ['status', 'started_at']
    search_fields = ['user__username', 'user__first_name']
    readonly_fields = ['started_at', 'completed_at']
    inlines = [MessageInline]
    
    fieldsets = (
        ('Conversation Info', {
            'fields': ('user', 'status')
        }),
        ('Timestamps', {
            'fields': ('started_at', 'completed_at')
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'conversation', 'role', 'message_type',
        'content_preview', 'created_at'
    ]
    list_filter = ['role', 'message_type', 'created_at']
    search_fields = ['content', 'conversation__user__username']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'organization', 'bot_type', 'is_active', 'created_at']
    list_filter = ['bot_type', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'organization__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('organization', 'name', 'description', 'bot_type')
        }),
        ('Telegram', {
            'fields': ('telegram_token', 'is_active')
        }),
        ('AI Configuration', {
            'fields': ('system_prompt',),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(KnowledgeBaseFile)
class KnowledgeBaseFileAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'bot', 'file_type', 'status', 'created_at']
    list_filter = ['file_type', 'status', 'created_at']
    search_fields = ['name', 'bot__name', 'content']
    readonly_fields = ['created_at', 'updated_at', 'processed_at', 'file_size']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('bot', 'name', 'file_type')
        }),
        ('Content', {
            'fields': ('file', 'content')
        }),
        ('Processing', {
            'fields': ('status', 'processing_error', 'file_size')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'processed_at')
        }),
    )


@admin.register(OrganizationInvite)
class OrganizationInviteAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'organization', 'role', 'is_accepted', 'created_at']
    list_filter = ['role', 'is_accepted', 'created_at']
    search_fields = ['email', 'organization__name']
    readonly_fields = ['token', 'created_at']
    
    fieldsets = (
        ('Invite Info', {
            'fields': ('organization', 'email', 'role')
        }),
        ('Status', {
            'fields': ('is_accepted', 'token', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Statistics)
class StatisticsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_users', 'new_users', 'total_conversations',
        'completed_conversations', 'documents_generated'
    ]
    list_filter = ['date']
    readonly_fields = [
        'date', 'total_users', 'new_users', 'total_conversations',
        'completed_conversations', 'total_messages', 'voice_messages',
        'documents_generated'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
