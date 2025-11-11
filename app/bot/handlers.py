"""
Telegram Bot handlers
"""
from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, Voice
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from asgiref.sync import sync_to_async
import logging
import os
import tempfile

from core.models import TelegramUser, Conversation, Message as DBMessage, Document
from ai_services.providers import get_ai_service, ARIZA_SYSTEM_PROMPT
from documents.generator import generate_ariza_document

logger = logging.getLogger('bot')

# Router for handlers
router = Router()


class ArizaStates(StatesGroup):
    """States for ariza generation conversation"""
    waiting_for_input = State()
    processing = State()


# Helper functions
@sync_to_async
def get_or_create_user(telegram_user):
    """Get or create TelegramUser from aiogram User"""
    user, created = TelegramUser.objects.get_or_create(
        telegram_id=telegram_user.id,
        defaults={
            'username': telegram_user.username,
            'first_name': telegram_user.first_name,
            'last_name': telegram_user.last_name,
            'language_code': telegram_user.language_code,
        }
    )
    if not created:
        # Update user info
        user.username = telegram_user.username
        user.first_name = telegram_user.first_name
        user.last_name = telegram_user.last_name
        user.save()
    return user


@sync_to_async
def get_or_create_conversation(user):
    """Get or create active conversation"""
    conversation = Conversation.objects.filter(
        user=user,
        status='active'
    ).first()
    
    if not conversation:
        conversation = Conversation.objects.create(user=user)
    
    return conversation


@sync_to_async
def save_message(conversation, role, content, message_type='text', voice_file_id=None, transcription=None):
    """Save message to database"""
    return DBMessage.objects.create(
        conversation=conversation,
        role=role,
        content=content,
        message_type=message_type,
        voice_file_id=voice_file_id,
        transcription=transcription
    )


@sync_to_async
def get_conversation_history(conversation):
    """Get conversation message history"""
    messages = DBMessage.objects.filter(
        conversation=conversation
    ).order_by('created_at')
    
    return [
        {
            'role': msg.role,
            'content': msg.content
        }
        for msg in messages
    ]


@sync_to_async
def save_document(conversation, filename, file_bytes, document_text):
    """Save generated document"""
    from django.core.files.base import ContentFile
    
    doc = Document.objects.create(
        conversation=conversation,
        filename=filename,
        document_text=document_text
    )
    doc.file.save(filename, ContentFile(file_bytes.read()))
    return doc


@sync_to_async
def mark_conversation_complete(conversation):
    """Mark conversation as completed"""
    conversation.is_document_ready = True
    conversation.mark_completed()


# Command handlers
@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Handle /start command"""
    user = await get_or_create_user(message.from_user)
    
    welcome_text = (
        f"🤝 Салом, {user.full_name}!\n\n"
        "Мен сизга ариза тузишда ёрдам бераман.\n\n"
        "💬 Нима учун ариза керак? Голосли ёки ёзма хабар юборинг.\n\n"
        "Мисол: \"Мен ишдан бўшаш учун ариза тузишим керак\""
    )
    
    await message.answer(welcome_text)
    await state.set_state(ArizaStates.waiting_for_input)
    
    logger.info(f"User {user.telegram_id} started bot")


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    """Handle /cancel command"""
    await state.clear()
    await message.answer(
        "❌ Жараён бекор қилинди.\n\n"
        "/start - янги ариза тузиш учун"
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    """Handle /help command"""
    help_text = (
        "📚 <b>Қандай фойдаланиш:</b>\n\n"
        "1️⃣ Голосли хабар юборинг ёки ёзинг\n"
        "2️⃣ Саволларга жавоб беринг\n"
        "3️⃣ Word файлни олинг\n\n"
        "<b>Буйруқлар:</b>\n"
        "/start - Янгидан бошлаш\n"
        "/cancel - Жараённи бекор қилиш\n"
        "/help - Ёрдам"
    )
    await message.answer(help_text, parse_mode='HTML')


# Voice message handler
@router.message(F.voice, ArizaStates.waiting_for_input)
async def handle_voice(message: Message, state: FSMContext):
    """Handle voice messages"""
    user = await get_or_create_user(message.from_user)
    conversation = await get_or_create_conversation(user)
    
    await message.answer("🎤 Обрабатываю голосовое сообщение...")
    
    try:
        # Download voice file
        voice: Voice = message.voice
        file = await message.bot.get_file(voice.file_id)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as tmp_file:
            await message.bot.download_file(file.file_path, tmp_file.name)
            tmp_path = tmp_file.name
        
        # Transcribe using AI service
        ai_service = get_ai_service()
        with open(tmp_path, 'rb') as audio_file:
            transcription = ai_service.transcribe_audio(audio_file, language='uz')
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Save message to DB
        await save_message(
            conversation=conversation,
            role='user',
            content=transcription,
            message_type='voice',
            voice_file_id=voice.file_id,
            transcription=transcription
        )
        
        # Process with AI
        await process_user_message(message, conversation, transcription, state)
        
        logger.info(f"Voice message transcribed: {len(transcription)} chars")
        
    except Exception as e:
        logger.error(f"Voice processing error: {e}", exc_info=True)
        await message.answer(
            "❌ Хатолик юз берди. Илтимос, қайта уриниб кўринг."
        )


# Text message handler
@router.message(F.text, ArizaStates.waiting_for_input)
async def handle_text(message: Message, state: FSMContext):
    """Handle text messages"""
    user = await get_or_create_user(message.from_user)
    conversation = await get_or_create_conversation(user)
    
    # Save message
    await save_message(
        conversation=conversation,
        role='user',
        content=message.text,
        message_type='text'
    )
    
    # Process with AI
    await process_user_message(message, conversation, message.text, state)


async def process_user_message(message: Message, conversation, user_text: str, state: FSMContext):
    """Process user message with AI"""
    try:
        # Get conversation history
        history = await get_conversation_history(conversation)
        
        # Get AI response
        ai_service = get_ai_service()
        assistant_response = ai_service.chat_completion(
            messages=history,
            system_prompt=ARIZA_SYSTEM_PROMPT
        )
        
        # Save assistant message
        await save_message(
            conversation=conversation,
            role='assistant',
            content=assistant_response
        )
        
        # Check if document is ready
        if '[DOCUMENT_READY]' in assistant_response:
            # Remove signal from response
            clean_response = assistant_response.replace('[DOCUMENT_READY]', '').strip()
            
            await message.answer(clean_response, parse_mode='Markdown')
            await message.answer("📄 Отлично! Сейчас создаю Word документ...")
            
            # Generate document
            await generate_and_send_document(message, conversation, clean_response)
            
            # Mark conversation as complete
            await mark_conversation_complete(conversation)
            
            # Clear state
            await state.clear()
            
        else:
            # Send AI response
            await message.answer(assistant_response, parse_mode='Markdown')
        
        logger.info(f"AI response sent: {len(assistant_response)} chars")
        
    except Exception as e:
        logger.error(f"AI processing error: {e}", exc_info=True)
        await message.answer(
            "❌ Хатолик юз берди. Илтимос, қайта уриниб кўринг."
        )


async def generate_and_send_document(message: Message, conversation, document_text: str):
    """Generate and send Word document"""
    try:
        # Generate document
        doc_bytes = generate_ariza_document(document_text)
        
        # Generate filename
        from datetime import datetime
        filename = f"ariza_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
        
        # Save to database
        await save_document(conversation, filename, doc_bytes, document_text)
        
        # Reset bytes position
        doc_bytes.seek(0)
        
        # Send document to user
        from aiogram.types import BufferedInputFile
        input_file = BufferedInputFile(doc_bytes.read(), filename=filename)
        
        await message.answer_document(
            document=input_file,
            caption=(
                "✅ Ваше заявление готово!\n\n"
                "⚠️ Важно: Проверьте все данные перед подписанием.\n\n"
                "💡 Рекомендация: Подавайте в 2 экземплярах, "
                "один с отметкой оставьте себе."
            )
        )
        
        logger.info(f"Document sent: {filename}")
        
    except Exception as e:
        logger.error(f"Document generation error: {e}", exc_info=True)
        await message.answer(
            "❌ Документ тузишда хатолик юз берди. "
            "Илтимос, администратор билан боғланинг."
        )


# Export router
__all__ = ['router']
