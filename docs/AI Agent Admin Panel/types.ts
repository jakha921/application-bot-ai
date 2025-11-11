// types.ts

export type Role = 'admin' | 'client-admin' | 'client-editor' | 'client-viewer';

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
}

export type ModelProvider = 'gemini' | 'openai' | 'custom';

// NEW: Centralized credential storage
export interface CredentialVaultItem {
  id: string;
  name: string; // e.g., "My OpenAI Key (Global)"
  provider: ModelProvider;
  apiKey: string; // Stored as base64
}

// UPDATED: ModelConfig now references the vault
export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  modelName: string;
  credentialId: string; // This is the ID from CredentialVaultItem
  isDefault: boolean;
}


export interface QAItem {
  id: number;
  question: string;
  answer: string;
  tags: string[];
}

export type UploadStatus = 'pending_upload' | 'processing_upload' | 'pending_rag' | 'processing_rag' | 'ready' | 'error';

export interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: number;
  status: UploadStatus;
  description?: string;
  content?: string;
}

export interface UnansweredQuestion {
  id: number;
  question: string;
  tags: string[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
    id:string;
    text: string;
    sender: 'user' | 'bot';
    isThinking?: boolean;
    sources?: GroundingSource[];
}

export interface ConversationLog {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  modelUsed: string;
  sources?: GroundingSource[];
  tags: string[]; // NEW FIELD
}

export interface FineTuneJob {
  jobId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  fineTunedModelName: string | null;
  createdAt: Date;
}

// --- NEW / UPDATED ---
export type ChannelType = 'telegram' | 'instagram' | 'web_widget';

export interface IntegrationChannel {
  id: string;
  type: ChannelType;
  isEnabled: boolean;
  // Webhook data (for incoming messages from platforms)
  webhookUrl: string; // Secret URL for Telegram/Instagram
  // API Access data (for outgoing actions or widgets)
  clientId: string; // Public ID for Web Widget
  clientSecret: string; // Secret key, shown only once
  allowedOrigins: string[]; // e.g., 'https://example.com'
  telegramBotToken?: string; // NEW
}
// --- END NEW / UPDATED ---


export interface Bot {
  id: string;
  name: string;
  accessibleUserIds: string[]; // UPDATED
  systemInstruction: string;
  isSearchGroundingEnabled: boolean;
  
  modelConfigurations: ModelConfig[];
  // --- UPDATED ---
  integrationChannels: IntegrationChannel[];

  qaDatabase: QAItem[];
  unansweredQuestions: UnansweredQuestion[];
  uploadedFiles: UploadedFile[];
  conversationLogs: ConversationLog[];
  fineTuneJob: FineTuneJob | null;
}

export type View =
  | 'dashboard'
  | 'database'
  | 'upload'
  | 'unanswered'
  | 'chatbot'
  | 'monitoring'
  | 'settings'
  | 'manage-bots'
  | 'user-management'
  | 'key-vault'; // NEW VIEW
