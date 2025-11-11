# Generated migration for Bot Factory platform refactoring

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_bot_template'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        # 1. Create OrganizationInvite model
        migrations.CreateModel(
            name='OrganizationInvite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, verbose_name='Email Address')),
                ('role', models.CharField(choices=[('owner', 'Owner'), ('admin', 'Admin'), ('editor', 'Editor'), ('viewer', 'Viewer')], default='viewer', max_length=50, verbose_name='Role')),
                ('token', models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='Invite Token')),
                ('is_accepted', models.BooleanField(default=False, verbose_name='Is Accepted')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True, verbose_name='Expiration Date')),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invites', to='organizations.organization')),
            ],
            options={
                'verbose_name': 'Organization Invite',
                'verbose_name_plural': 'Organization Invites',
                'db_table': 'organization_invites',
                'ordering': ['-created_at'],
            },
        ),
        
        # 2. Remove fields from Conversation (document-specific)
        migrations.RemoveField(
            model_name='conversation',
            name='document_type',
        ),
        migrations.RemoveField(
            model_name='conversation',
            name='is_document_ready',
        ),
        
        # 3. Update Bot model - Add new fields
        migrations.AddField(
            model_name='bot',
            name='system_prompt',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='System Prompt',
                help_text='Main instructions/role for the bot'
            ),
        ),
        migrations.AddField(
            model_name='bot',
            name='bot_type',
            field=models.CharField(
                choices=[('chatbot', 'Chatbot'), ('assistant', 'Assistant'), ('custom', 'Custom')],
                default='chatbot',
                max_length=50,
                verbose_name='Bot Type',
                help_text='Type of bot functionality'
            ),
        ),
        
        # 4. Remove Bot statistics fields
        migrations.RemoveField(
            model_name='bot',
            name='total_conversations',
        ),
        migrations.RemoveField(
            model_name='bot',
            name='total_documents',
        ),
        
        # 5. Rename Template to KnowledgeBaseFile
        migrations.RenameModel(
            old_name='Template',
            new_name='KnowledgeBaseFile',
        ),
        
        # 6. Alter KnowledgeBaseFile table name and meta
        migrations.AlterModelOptions(
            name='knowledgebasefile',
            options={
                'ordering': ['-created_at'],
                'verbose_name': 'Knowledge Base File',
                'verbose_name_plural': 'Knowledge Base Files',
            },
        ),
        migrations.AlterModelTable(
            name='knowledgebasefile',
            table='knowledge_base_files',
        ),
        
        # 7. Remove old Template fields from KnowledgeBaseFile
        migrations.RemoveField(
            model_name='knowledgebasefile',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='knowledgebasefile',
            name='category',
        ),
        migrations.RemoveField(
            model_name='knowledgebasefile',
            name='is_public',
        ),
        migrations.RemoveField(
            model_name='knowledgebasefile',
            name='usage_count',
        ),
        migrations.RemoveField(
            model_name='knowledgebasefile',
            name='description',
        ),
        
        # 8. Add new fields to KnowledgeBaseFile
        migrations.AddField(
            model_name='knowledgebasefile',
            name='bot',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='knowledge_files',
                to='core.bot',
                verbose_name='Bot',
                null=True,  # Keep nullable for migration
                blank=True
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='file',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='knowledge_base/%Y/%m/%d/',
                verbose_name='File',
                help_text='Upload PDF/DOCX file'
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='file_type',
            field=models.CharField(
                choices=[('text', 'Text'), ('pdf', 'PDF'), ('docx', 'DOCX'), ('url', 'URL')],
                default='text',
                max_length=20,
                verbose_name='File Type'
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('processing', 'Processing'), ('ready', 'Ready'), ('error', 'Error')],
                default='pending',
                max_length=20,
                verbose_name='Processing Status'
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='file_size',
            field=models.BigIntegerField(
                blank=True,
                null=True,
                verbose_name='File Size (bytes)'
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='processing_error',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Processing Error'
            ),
        ),
        migrations.AddField(
            model_name='knowledgebasefile',
            name='processed_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Processed At'
            ),
        ),
        
        # 9. Alter existing KnowledgeBaseFile fields
        migrations.AlterField(
            model_name='knowledgebasefile',
            name='name',
            field=models.CharField(
                max_length=200,
                verbose_name='File Name',
                help_text='Name of the knowledge base file'
            ),
        ),
        migrations.AlterField(
            model_name='knowledgebasefile',
            name='content',
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name='Content',
                help_text='Text content or extracted text from file'
            ),
        ),
        
        # 10. Add index for KnowledgeBaseFile
        migrations.AddIndex(
            model_name='knowledgebasefile',
            index=models.Index(fields=['bot', 'status'], name='knowledge_b_bot_id_status_idx'),
        ),
        
        # 11. Delete Document model
        migrations.DeleteModel(
            name='Document',
        ),
    ]
