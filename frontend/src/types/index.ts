// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_status: string;
  bots_quota: number;
  bots_used: number;
  documents_quota: number;
  documents_used: number;
  api_calls_quota: number;
  api_calls_used: number;
  created_at: string;
  settings?: Record<string, any>;
}

// User types
export interface User {
  id: string;
  email?: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  organization?: Organization;
  is_active: boolean;
  created_at: string;
}

// Bot types
export interface Bot {
  id: string;
  organization: string;
  name: string;
  bot_type: 'telegram' | 'webhook';
  telegram_token?: string;
  webhook_url?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Template types
export interface Template {
  id: string;
  organization?: string;
  name: string;
  category: string;
  description: string;
  template_text: string;
  ai_prompt: string;
  required_fields: string[];
  is_public: boolean;
  is_premium: boolean;
  usage_count: number;
  rating?: number;
  created_at: string;
}

// Document types
export interface Document {
  id: string;
  organization: string;
  conversation_id?: string;
  template_id?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  document_type: string;
  generated_text: string;
  file_url?: string;
  created_at: string;
}

// Conversation types
export interface Conversation {
  id: string;
  organization: string;
  user_id: string;
  source: 'telegram' | 'web' | 'api';
  status: 'active' | 'completed' | 'cancelled';
  messages: Message[];
  started_at: string;
  completed_at?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// Subscription types
export interface Subscription {
  id: string;
  organization: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// Analytics types
export interface Analytics {
  total_documents: number;
  documents_by_template: Record<string, number>;
  documents_by_day: Array<{ day: string; count: number }>;
  average_generation_time: number;
  success_rate: number;
}

// API Key types
export interface APIKey {
  id: string;
  organization: string;
  name: string;
  prefix: string;
  permissions: Record<string, boolean>;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}
