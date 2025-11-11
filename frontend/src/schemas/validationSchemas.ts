import { z } from 'zod';

// Bot validation schema
export const botSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional()
    .or(z.literal('')),
  
  telegram_token: z.string()
    .min(1, 'Telegram токен обязателен')
    .regex(
      /^\d+:[A-Za-z0-9_-]+$/,
      'Неверный формат токена. Должен быть в формате: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz'
    ),
  
  system_prompt: z.string()
    .max(5000, 'Инструкция не должна превышать 5000 символов')
    .optional()
    .or(z.literal('')),
  
  bot_type: z.enum(['chatbot', 'assistant', 'custom'], {
    message: 'Выберите тип бота',
  }).default('chatbot'),
  
  is_active: z.boolean().optional().default(true),
});

export type BotFormData = z.infer<typeof botSchema>;

// KnowledgeBaseFile validation schema
export const knowledgeBaseFileSchema = z.object({
  bot: z.number({
    required_error: 'Выберите бота',
    invalid_type_error: 'Выберите бота из списка',
  }),
  
  name: z.string()
    .min(1, 'Название обязательно')
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  
  content: z.string()
    .optional()
    .or(z.literal('')),
  
  file_type: z.enum(['text', 'pdf', 'docx', 'url'], {
    message: 'Выберите тип файла',
  }).default('text'),
  
  file: z.instanceof(File).optional().nullable(),
});

export type KnowledgeBaseFileFormData = z.infer<typeof knowledgeBaseFileSchema>;

// Template validation schema (DEPRECATED - kept for backward compatibility)
export const templateSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional()
    .or(z.literal('')),
  
  content: z.string()
    .min(1, 'Контент шаблона обязателен')
    .min(10, 'Контент должен содержать минимум 10 символов')
    .max(10000, 'Контент не должен превышать 10000 символов'),
  
  category: z.string()
    .min(1, 'Категория обязательна'),
  
  is_public: z.boolean().default(false),
});

export type TemplateFormData = z.infer<typeof templateSchema>;

// User validation schema
export const userSchema = z.object({
  email: z.string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  
  full_name: z.string()
    .max(200, 'Имя не должно превышать 200 символов')
    .optional()
    .or(z.literal('')),
  
  role: z.enum(['owner', 'admin', 'editor', 'viewer'], {
    message: 'Роль обязательна',
  }),
  
  is_active: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  
  password: z.string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Settings validation schemas
export const generalSettingsSchema = z.object({
  orgName: z.string()
    .min(1, 'Название организации обязательно')
    .max(200, 'Название не должно превышать 200 символов'),
  
  orgDescription: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional()
    .or(z.literal('')),
  
  language: z.enum(['ru', 'uz', 'en']).default('ru'),
  
  timezone: z.string().default('Asia/Tashkent'),
});

export const modelSettingsSchema = z.object({
  aiProvider: z.enum(['openai', 'gemini'], {
    message: 'Выберите AI провайдера',
  }),
  
  apiKey: z.string()
    .min(1, 'API ключ обязателен')
    .min(20, 'API ключ слишком короткий'),
  
  temperature: z.number()
    .min(0, 'Температура должна быть от 0 до 2')
    .max(2, 'Температура должна быть от 0 до 2'),
  
  maxTokens: z.number()
    .min(100, 'Минимум 100 токенов')
    .max(4000, 'Максимум 4000 токенов'),
});

export const integrationSettingsSchema = z.object({
  telegramEnabled: z.boolean().default(true),
  telegramWebhook: z.string()
    .url('Неверный формат URL')
    .optional()
    .or(z.literal('')),
  
  webWidgetEnabled: z.boolean().default(false),
});

export const advancedSettingsSchema = z.object({
  enableGrounding: z.boolean().default(true),
  enableFineTuning: z.boolean().default(false),
  maxConversationHistory: z.number()
    .min(1, 'Минимум 1 сообщение')
    .max(50, 'Максимум 50 сообщений'),
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
export type ModelSettingsFormData = z.infer<typeof modelSettingsSchema>;
export type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;
export type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;
