import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type User,
  type Bot,
  type Role,
  type QAItem,
  type ConversationLog,
  type UnansweredQuestion,
  type UploadedFile,
  type UploadStatus,
  type FineTuneJob,
  type IntegrationChannel,
  type CredentialVaultItem, // NEW
  type ModelProvider,
} from '../types';

// --- Initial Data ---
const initialUsers: User[] = [
    { id: 'user_admin', username: 'admin', password: 'admin123', role: 'admin' },
    { id: 'user_client_1', username: 'client', password: 'client123', role: 'client-admin' },
];

const initialVault: CredentialVaultItem[] = [
    { id: 'cred_gemini_1', name: 'Platform Gemini Key', provider: 'gemini', apiKey: ''},
    { id: 'cred_openai_1', name: 'Platform OpenAI Key', provider: 'openai', apiKey: ''},
];


const createNewBot = (name: string, creatorId: string): Bot => ({
    id: `bot_${Date.now()}`,
    name,
    accessibleUserIds: [creatorId],
    systemInstruction: 'You are a friendly and helpful assistant.',
    isSearchGroundingEnabled: false,
    modelConfigurations: [
      { id: 'default_gemini', provider: 'gemini', modelName: 'gemini-2.5-flash', credentialId: 'cred_gemini_1', isDefault: true }
    ],
    integrationChannels: [],
    qaDatabase: [],
    unansweredQuestions: [],
    uploadedFiles: [],
    conversationLogs: [],
    fineTuneJob: null,
});

const initialBots: Bot[] = [
  {
    id: 'bot_1',
    name: 'Customer Support (Gemini)',
    accessibleUserIds: ['user_admin', 'user_client_1'],
    systemInstruction: 'You are a customer support assistant.',
    isSearchGroundingEnabled: true,
    modelConfigurations: [
       { id: 'gemini_1', provider: 'gemini', modelName: 'gemini-2.5-flash', credentialId: 'cred_gemini_1', isDefault: true },
       { id: 'openai_1', provider: 'openai', modelName: 'gpt-4o', credentialId: 'cred_openai_1', isDefault: false }
    ],
    integrationChannels: [
      { 
        id: 'tg_bot1', 
        type: 'telegram', 
        isEnabled: true, 
        webhookUrl: `https://api.your-service.com/wh/tg_12345`,
        clientId: '',
        clientSecret: '',
        allowedOrigins: [],
        telegramBotToken: ''
      },
      { 
        id: 'web_bot1', 
        type: 'web_widget', 
        isEnabled: true, 
        webhookUrl: '',
        clientId: `client_widget_abc`,
        clientSecret: `sk_live_def`,
        allowedOrigins: ['https://my-shop.com']
      }
    ],
    qaDatabase: [
      { id: 1, question: "What are the shipping methods?", answer: "We offer courier and self-pickup.", tags: ['shipping', 'logistics'] },
      { id: 2, question: "What is the return policy?", answer: "You can return items within 30 days.", tags: ['returns', 'policy'] },
    ],
    unansweredQuestions: [
      { id: 101, question: "Do you ship to Mars?", tags: ['shipping', 'international'] }
    ],
    uploadedFiles: [
        { id: 1, name: 'policy.pdf', type: 'application/pdf', size: 102400, status: 'ready', content: 'This is a preview of the policy document...' },
        { id: 2, name: 'product_catalog.docx', type: 'application/msword', size: 512000, status: 'ready', content: 'This is a preview of the product catalog...' }
    ],
    conversationLogs: [
      { id: 'log1', question: 'Hi there!', answer: 'Hello! How can I help you?', timestamp: new Date(Date.now() - 3600000), modelUsed: 'gemini-2.5-flash', tags: ['greeting', 'general'] },
      { id: 'log2', question: 'What is your return policy?', answer: 'You can return items within 30 days.', timestamp: new Date(), modelUsed: 'gemini-2.5-flash', tags: ['policy', 'returns'] }
    ],
    fineTuneJob: null,
  },
];

// --- Store Interface ---
interface AppState {
  users: User[];
  bots: Bot[];
  credentialVault: CredentialVaultItem[]; // NEW
  currentUser: User | null;
  currentBotId: string | null;

  actions: {
    login: (username: string, password: string) => boolean;
    logout: () => void;
    setCurrentBotId: (id: string | null) => void;
    // Vault Actions (NEW)
    addCredential: (name: string, provider: ModelProvider, apiKey: string) => void;
    updateCredential: (id: string, data: Partial<Omit<CredentialVaultItem, 'id'>>) => void;
    deleteCredential: (id: string) => void;
    // User Actions
    getUsers: () => User[];
    addUser: (username: string, password: string, role: Role, accessibleBotIds?: string[]) => void;
    updateUser: (id: string, data: Partial<Omit<User, 'id'>>, accessibleBotIds?: string[]) => void;
    deleteUser: (id: string) => void;
    // Bot Actions
    getVisibleBots: (user: User) => Bot[];
    addBot: (name: string, creatorId: string) => Bot;
    updateBot: (id: string, data: Partial<Omit<Bot, 'id'>>) => void;
    deleteBot: (id: string) => void;
    // Current Bot Actions
    updateCurrentBot: (data: Partial<Omit<Bot, 'id'>>) => void;
    addLogToCurrentBot: (log: Omit<ConversationLog, 'id' | 'timestamp' | 'tags'>, tags: string[]) => void;
    addQaItemToCurrentBot: (qaItem: Omit<QAItem, 'id'>) => void;
    setQaDataForCurrentBot: (qaData: QAItem[]) => void;
    setUnansweredQuestionsForCurrentBot: (questions: UnansweredQuestion[]) => void;
    deleteUnansweredQuestionFromCurrentBot: (questionId: number) => void;
    setUploadedFilesForCurrentBot: (files: UploadedFile[]) => void;
    setFileStatus: (fileId: number, status: UploadStatus) => void;
    setBotFineTuneJob: (job: FineTuneJob | null) => void;
    addUnansweredQuestion: (question: string, tags: string[]) => void;
    addChannelToCurrentBot: (channel: IntegrationChannel) => void;
  }
}

// --- Store Implementation ---
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      bots: initialBots,
      credentialVault: initialVault, // NEW
      currentUser: null,
      currentBotId: null,

      actions: {
        // --- Auth ---
        login: (username, password) => {
          const user = get().users.find(u => u.username === username && u.password === password);
          if (user) {
            set({ currentUser: user });
            const visibleBots = get().actions.getVisibleBots(user);
            set({ currentBotId: visibleBots.length > 0 ? visibleBots[0].id : null });
            return true;
          }
          return false;
        },
        logout: () => set({ currentUser: null, currentBotId: null }),
        setCurrentBotId: (id) => set({ currentBotId: id }),

        // --- Vault CRUD (NEW) ---
        addCredential: (name, provider, apiKey) => {
            const newItem: CredentialVaultItem = { id: `cred_${Date.now()}`, name, provider, apiKey };
            set(state => ({ credentialVault: [...state.credentialVault, newItem]}));
        },
        updateCredential: (id, data) => {
            set(state => ({
                credentialVault: state.credentialVault.map(c => c.id === id ? { ...c, ...data } : c)
            }));
        },
        deleteCredential: (id) => {
            set(state => ({
                credentialVault: state.credentialVault.filter(c => c.id !== id),
                // Also remove this credential from any bots using it
                bots: state.bots.map(bot => ({
                    ...bot,
                    modelConfigurations: bot.modelConfigurations.map(mc => 
                        mc.credentialId === id ? { ...mc, credentialId: '' } : mc
                    )
                }))
            }));
        },

        // --- User CRUD ---
        getUsers: () => get().users,
        addUser: (username, password, role, accessibleBotIds) => {
          const newUser: User = { id: `user_${Date.now()}`, username, password, role };
          set(state => {
            let updatedBots = state.bots;
            if (accessibleBotIds && accessibleBotIds.length > 0) {
              updatedBots = state.bots.map(bot => {
                if (accessibleBotIds.includes(bot.id)) {
                  return { ...bot, accessibleUserIds: [...bot.accessibleUserIds, newUser.id] };
                }
                return bot;
              });
            }
            return { users: [...state.users, newUser], bots: updatedBots };
          });
        },
        updateUser: (id, data, accessibleBotIds) => {
            set(state => {
                const updatedUsers = state.users.map(u => {
                    if (u.id === id) {
                        const { password, ...restOfData } = data;
                        const newUserData = { ...u, ...restOfData };
                        if (password) {
                            newUserData.password = password;
                        }
                        return newUserData;
                    }
                    return u;
                });
        
                let updatedBots = state.bots;
                if (accessibleBotIds !== undefined) {
                    updatedBots = state.bots.map(bot => {
                        const hasAccess = bot.accessibleUserIds.includes(id);
                        const shouldHaveAccess = accessibleBotIds.includes(bot.id);
        
                        if (shouldHaveAccess && !hasAccess) {
                            return { ...bot, accessibleUserIds: [...bot.accessibleUserIds, id] };
                        }
                        if (!shouldHaveAccess && hasAccess) {
                            return { ...bot, accessibleUserIds: bot.accessibleUserIds.filter(userId => userId !== id) };
                        }
                        return bot;
                    });
                }
                return { users: updatedUsers, bots: updatedBots };
            });
        },
        deleteUser: (id) => {
          if (id === 'user_admin') return;
          set(state => ({
            users: state.users.filter(u => u.id !== id),
            bots: state.bots.map(bot => ({
                ...bot,
                accessibleUserIds: bot.accessibleUserIds.filter(userId => userId !== id),
            })),
          }));
        },

        // --- Bot CRUD ---
        getVisibleBots: (user: User) => {
          const { bots } = get();
          if (user.role === 'admin') return bots;
          return bots.filter(bot => bot.accessibleUserIds.includes(user.id));
        },
        addBot: (name, creatorId) => {
          const newBot = createNewBot(name, creatorId);
          set(state => ({ bots: [...state.bots, newBot] }));
          return newBot;
        },
        updateBot: (id, data) => {
          set(state => ({
            bots: state.bots.map(b => b.id === id ? { ...b, ...data } : b)
          }));
        },
        deleteBot: (id) => {
          set(state => ({
            bots: state.bots.filter(b => b.id !== id)
          }));
        },

        // --- Current Bot Actions ---
        updateCurrentBot: (data) => {
          const { currentBotId } = get();
          if (!currentBotId) return;
          set(state => ({
            bots: state.bots.map(bot =>
              bot.id === currentBotId ? { ...bot, ...data } : bot
            )
          }));
        },
        addLogToCurrentBot: (log, tags) => {
            const { currentBotId } = get();
            if (!currentBotId) return;
            const newLog: ConversationLog = { ...log, id: Date.now().toString(), timestamp: new Date(), tags };
            const currentLogs = get().bots.find(b => b.id === currentBotId)?.conversationLogs ?? [];
            get().actions.updateCurrentBot({
                conversationLogs: [newLog, ...currentLogs]
            });
        },
        addQaItemToCurrentBot: (qaItem) => {
            const newQaEntry: QAItem = { ...qaItem, id: Date.now() };
            const bot = get().bots.find(b => b.id === get().currentBotId);
            if (bot) {
                get().actions.updateCurrentBot({ qaDatabase: [...bot.qaDatabase, newQaEntry] });
            }
        },
        setQaDataForCurrentBot: (qaData) => get().actions.updateCurrentBot({ qaDatabase: qaData }),
        setUnansweredQuestionsForCurrentBot: (questions) => get().actions.updateCurrentBot({ unansweredQuestions: questions }),
        deleteUnansweredQuestionFromCurrentBot: (questionId) => {
            const bot = get().bots.find(b => b.id === get().currentBotId);
            if (bot) {
                get().actions.updateCurrentBot({
                    unansweredQuestions: bot.unansweredQuestions.filter(q => q.id !== questionId)
                });
            }
        },
        setUploadedFilesForCurrentBot: (files) => get().actions.updateCurrentBot({ uploadedFiles: files }),

        setFileStatus: (fileId, status) => {
          const { currentBotId } = get();
          if (!currentBotId) return;
          const bot = get().bots.find(b => b.id === currentBotId);
          if (!bot) return;
          const updatedFiles = bot.uploadedFiles.map(f =>
            f.id === fileId ? { ...f, status } : f
          );
          get().actions.updateCurrentBot({ uploadedFiles: updatedFiles });
        },

        setBotFineTuneJob: (job) => {
          get().actions.updateCurrentBot({ fineTuneJob: job });
        },

        addUnansweredQuestion: (question, tags) => {
          const { currentBotId } = get();
          if (!currentBotId) return;
          const newUnanswered: UnansweredQuestion = {
            id: Date.now(),
            question,
            tags
          };
          const bot = get().bots.find(b => b.id === currentBotId);
          if (bot) {
            get().actions.updateCurrentBot({
              unansweredQuestions: [newUnanswered, ...bot.unansweredQuestions]
            });
          }
        },
        addChannelToCurrentBot: (channel) => { // NEW
            const bot = get().bots.find(b => b.id === get().currentBotId);
            if (bot) {
                get().actions.updateCurrentBot({
                    integrationChannels: [...bot.integrationChannels, channel]
                });
            }
        }
      }
    }),
    {
      name: 'bot-admin-storage',
      partialize: (state) => ({ users: state.users, bots: state.bots, credentialVault: state.credentialVault }),
    }
  )
);

// --- Selectors ---
export const useCredentialVault = () => useAppStore(state => state.credentialVault); // NEW
export const useCurrentUser = () => useAppStore(state => state.currentUser);
export const useCurrentBotId = () => useAppStore(state => state.currentBotId);
export const useStoreActions = () => useAppStore(state => state.actions);

export const useCurrentBotData = () => {
  const bots = useAppStore(state => state.bots);
  const currentBotId = useAppStore(state => state.currentBotId);
  return bots.find(b => b.id === currentBotId) || null;
};

export const useVisibleBots = () => {
  const bots = useAppStore(state => state.bots);
  const currentUser = useAppStore(state => state.currentUser);
  if (!currentUser) return [];
  return useAppStore.getState().actions.getVisibleBots(currentUser);
};