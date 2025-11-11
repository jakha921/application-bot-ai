"""
AI Service Provider Factory
Supports OpenAI and Google Gemini
"""
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BaseAIService:
    """Base class for AI services"""
    
    def transcribe_audio(self, audio_file, language='uz'):
        """Transcribe audio to text"""
        raise NotImplementedError
    
    def chat_completion(self, messages, system_prompt=None):
        """Get chat completion"""
        raise NotImplementedError


class OpenAIService(BaseAIService):
    """OpenAI service implementation"""
    
    def __init__(self):
        import openai
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.whisper_model = settings.WHISPER_MODEL
        logger.info("OpenAI service initialized")
    
    def transcribe_audio(self, audio_file, language='uz'):
        """
        Transcribe audio using Whisper
        
        Args:
            audio_file: File object or path
            language: Language code (uz, ru, en) - uz will auto-detect
        
        Returns:
            str: Transcribed text
        """
        try:
            # Whisper doesn't support 'uz' code, but will auto-detect Uzbek
            # Use prompt to guide transcription to Cyrillic
            prompt = "Бу ўзбек тилида расмий арiza. Кирилл ёзувида транскрипция қилинг."
            
            # Don't pass language='uz' as it's not supported
            # Whisper will auto-detect the language
            transcription = self.client.audio.transcriptions.create(
                model=self.whisper_model,
                file=audio_file,
                prompt=prompt
            )
            
            logger.info(f"Audio transcribed successfully: {len(transcription.text)} chars")
            return transcription.text
            
        except Exception as e:
            logger.error(f"OpenAI transcription error: {e}")
            raise
    
    def chat_completion(self, messages, system_prompt=None):
        """
        Get chat completion from OpenAI
        
        Args:
            messages: List of message dicts [{"role": "user", "content": "..."}]
            system_prompt: Optional system prompt
        
        Returns:
            str: Assistant response
        """
        try:
            formatted_messages = []
            
            if system_prompt:
                formatted_messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            formatted_messages.extend(messages)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                max_tokens=4096,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            logger.info(f"Chat completion received: {len(assistant_message)} chars")
            
            return assistant_message
            
        except Exception as e:
            logger.error(f"OpenAI chat completion error: {e}")
            raise


class GeminiService(BaseAIService):
    """Google Gemini service implementation"""
    
    def __init__(self):
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info("Gemini service initialized")
    
    def transcribe_audio(self, audio_file, language='uz'):
        """
        Transcribe audio using Gemini
        Note: Gemini doesn't have native audio transcription yet,
        so we'll use it for chat only and fallback to OpenAI for audio
        """
        logger.warning("Gemini doesn't support audio transcription, use OpenAI")
        raise NotImplementedError(
            "Please use OpenAI for audio transcription or implement Chirp API"
        )
    
    def chat_completion(self, messages, system_prompt=None):
        """
        Get chat completion from Gemini
        
        Args:
            messages: List of message dicts
            system_prompt: Optional system prompt
        
        Returns:
            str: Assistant response
        """
        try:
            # Format messages for Gemini
            prompt_parts = []
            
            if system_prompt:
                prompt_parts.append(f"System: {system_prompt}\n\n")
            
            for msg in messages:
                role = msg['role']
                content = msg['content']
                if role == 'user':
                    prompt_parts.append(f"User: {content}\n")
                elif role == 'assistant':
                    prompt_parts.append(f"Assistant: {content}\n")
            
            prompt_parts.append("Assistant: ")
            full_prompt = "".join(prompt_parts)
            
            response = self.model.generate_content(full_prompt)
            assistant_message = response.text
            
            logger.info(f"Gemini completion received: {len(assistant_message)} chars")
            return assistant_message
            
        except Exception as e:
            logger.error(f"Gemini chat completion error: {e}")
            raise


def get_ai_service():
    """
    Factory function to get AI service based on settings
    
    Returns:
        BaseAIService: AI service instance
    """
    provider = settings.AI_PROVIDER.lower()
    
    if provider == 'openai':
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set")
        return OpenAIService()
    
    elif provider == 'gemini':
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        return GeminiService()
    
    else:
        raise ValueError(f"Unknown AI provider: {provider}")


# System prompt for ariza generation
ARIZA_SYSTEM_PROMPT = """# Руководство для Помощника по Заявлениям

Вы — эксперт по составлению официальных заявлений (ариза) для Узбекистана.

**ВАЖНО**: Вы ведете диалог с пользователем. НЕ ДАВАЙТЕ шаблон сразу!

## Ваш процесс:

1. **Сначала соберите информацию** - задайте уточняющие вопросы:
   - Кимга мурожаат қиляпсиз? (Организация, должность, ФИО)
   - Ким томонидан? (Ваши ФИО, адрес, телефон)
   - Мақсад нима? (Что просите?)
   - Тафсилотлар? (Даты, номера, детали)

2. **Составьте документ** только после того, как получили ВСЕ данные:
   ```
   [Кимга]
   [Кимдан]
   
                    А Р И З А
   
   Сиздан [мақсад] сўрайман...
   [Тафсилотлар]
   
   Илова: [если есть]
   
   [Сана]                                    [Имзо]
   ```

3. **Сигнал готовности**: Когда документ готов, добавьте в конец:
   `[DOCUMENT_READY]`

**Тон**: Вежливо, официально. Только узбекский (кириллица).
**Запрещено**: Юридические консультации, придумывание фактов.
"""
