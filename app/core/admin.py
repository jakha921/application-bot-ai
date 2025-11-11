"""
Admin configuration for core models
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import TelegramUser, Conversation, Message, Document, Statistics


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
        'id', 'user', 'status', 'document_type',
        'is_document_ready', 'started_at'
    ]
    list_filter = ['status', 'is_document_ready', 'started_at']
    search_fields = ['user__username', 'user__first_name', 'document_type']
    readonly_fields = ['started_at', 'completed_at']
    inlines = [MessageInline]
    
    fieldsets = (
        ('Conversation Info', {
            'fields': ('user', 'status', 'document_type', 'is_document_ready')
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


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'filename', 'conversation', 'download_link', 'created_at']
    list_filter = ['created_at']
    search_fields = ['filename', 'conversation__user__username']
    readonly_fields = ['created_at', 'download_link']
    
    def download_link(self, obj):
        if obj.file:
            return format_html(
                '<a href="{}" target="_blank">Download</a>',
                obj.file.url
            )
        return '-'
    download_link.short_description = 'File'


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
