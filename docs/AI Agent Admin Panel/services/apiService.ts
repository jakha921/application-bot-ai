import { toast } from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import {
  type User,
  type Role,
  type Bot,
  type ChatMessage,
  type QAItem,
  type IntegrationChannel,
  type ChannelType,
  type UploadedFile,
  type UnansweredQuestion,
  type CredentialVaultItem,
  type ModelProvider,
} from '../types';
import { exportService } from './exportService';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStore = () => useAppStore.getState();

// --- Auth ---
const login = async (username: string, password: string): Promise<User | null> => {
    await delay(500);
    const success = getStore().actions.login(username, password);
    return success ? getStore().currentUser : null;
}

// --- Key Vault (NEW) ---
const getCredentials = async (): Promise<CredentialVaultItem[]> => {
    await delay(300);
    return getStore().credentialVault;
};

const addCredential = async (name: string, provider: ModelProvider, apiKey: string): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.addCredential(name, provider, apiKey);
    };
    await toast.promise(promise(), {
        loading: 'Adding credential...',
        success: 'Credential added!',
        error: 'Failed to add credential.',
    });
};

const updateCredential = async (id: string, data: Partial<Omit<CredentialVaultItem, 'id'>>): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.updateCredential(id, data);
    };
    await toast.promise(promise(), {
        loading: 'Updating credential...',
        success: 'Credential updated!',
        error: 'Failed to update credential.',
    });
};

const deleteCredential = async (id: string): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.deleteCredential(id);
    };
    await toast.promise(promise(), {
        loading: 'Deleting credential...',
        success: 'Credential deleted.',
        error: 'Failed to delete credential.',
    });
};


// --- Bot Management ---
const getBots = async (): Promise<Bot[]> => {
    await delay(300);
    const currentUser = getStore().currentUser;
    if (!currentUser) return [];
    return getStore().actions.getVisibleBots(currentUser);
}

const addBot = async (name: string): Promise<void> => {
    const promise = async () => {
        await delay(400);
        const currentUser = getStore().currentUser;
        if (!currentUser) throw new Error("User not logged in");
        getStore().actions.addBot(name, currentUser.id);
    };
    await toast.promise(promise(), {
        loading: 'Creating bot...',
        success: 'Bot created successfully!',
        error: 'Failed to create bot.',
    });
}

const deleteBot = async (id: string): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.deleteBot(id);
    }
    await toast.promise(promise(), {
        loading: 'Deleting bot...',
        success: 'Bot deleted successfully.',
        error: 'Failed to delete bot.',
    });
}

const updateBot = async (id: string, data: Partial<Bot>): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.updateBot(id, data);
    }
    await toast.promise(promise(), {
        loading: 'Updating bot...',
        success: 'Bot updated successfully.',
        error: 'Failed to update bot.',
    });
}

// --- User Management ---
const getUsers = async (): Promise<User[]> => {
    await delay(300);
    return getStore().actions.getUsers();
}

const addUser = async (username: string, password: string, role: Role, accessibleBotIds?: string[]): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.addUser(username, password, role, accessibleBotIds);
    }
    await toast.promise(promise(), {
        loading: 'Adding user...',
        success: 'User added successfully.',
        error: 'Failed to add user.',
    });
}

const updateUser = async (id: string, data: Partial<Omit<User, 'id'>>, accessibleBotIds?: string[]): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.updateUser(id, data, accessibleBotIds);
    }
    await toast.promise(promise(), {
        loading: 'Updating user...',
        success: 'User updated successfully.',
        error: 'Failed to update user.',
    });
};

const deleteUser = async (id: string): Promise<void> => {
    const promise = async () => {
        await delay(400);
        getStore().actions.deleteUser(id);
    }
    await toast.promise(promise(), {
        loading: 'Deleting user...',
        success: 'User deleted successfully.',
        error: 'Failed to delete user.',
    });
}

// --- Chat ---
const postChatMessage = async (botId: string, message: string): Promise<ChatMessage> => {
    await delay(1500); // Simulate network and AI processing
    const bot = getStore().bots.find(b => b.id === botId);
    if (!bot) throw new Error("Bot not found");

    const defaultModel = bot.modelConfigurations.find(m => m.isDefault) || bot.modelConfigurations[0];
    const modelUsed = `${defaultModel.provider}/${defaultModel.modelName}`;

    // Mock logic for unanswered questions
    if (message.toLowerCase().includes('i don\'t know') || message.toLowerCase().includes('cannot find')) {
        const generatedTags = await getTagsForQuestion(message, bot.systemInstruction);
        getStore().actions.addUnansweredQuestion(message, generatedTags);
        
        const failureAnswer = "I'm sorry, I couldn't find an answer to your question. Your query has been forwarded to a human operator.";
        getStore().actions.addLogToCurrentBot({
            question: message,
            answer: failureAnswer,
            modelUsed: modelUsed,
            sources: []
        }, ['unanswered', ...generatedTags]);
        return { id: Date.now().toString(), text: failureAnswer, sender: 'bot' };
    }

    const answer = `(Mock) Response from ${modelUsed} to your question: "${message}"`;
    const mockTags = ['chat_log', message.toLowerCase().includes('shipping') ? 'shipping' : 'general'];

    getStore().actions.addLogToCurrentBot({
      question: message,
      answer: answer,
      modelUsed: modelUsed,
      sources: []
    }, mockTags);

    return {
      id: Date.now().toString(),
      text: answer,
      sender: 'bot',
      sources: []
    };
}

// --- Settings ---
const updateBotSettings = async (data: Partial<Omit<Bot, 'id'>>): Promise<void> => {
    const updatePromise = async () => {
        await delay(500);
        if ('name' in data && data.name?.toLowerCase() === 'error') {
          throw new Error("Failed to save settings!");
        }
        getStore().actions.updateCurrentBot(data);
    };
    await toast.promise(
        updatePromise(),
        {
            loading: 'Saving settings...',
            success: 'Settings saved successfully!',
            error: (err) => err.message || 'Error saving settings.',
        }
    );
}

// --- Q&A and Unanswered ---
const getTagsForQuestion = async (question: string, instruction: string): Promise<string[]> => {
    await delay(500); 
    console.log("Mock AI Tagging based on instruction:", instruction, "and question:", question);
    if (question.includes('shipping')) return ['shipping', 'orders'];
    if (question.includes('payment')) return ['payment', 'finance'];
    return ['mock_tag_1', 'general'];
};

const addQaItem = async (qaItem: Omit<QAItem, 'id'>): Promise<void> => {
    const promise = async () => {
        await delay(300);
        getStore().actions.addQaItemToCurrentBot(qaItem);
    };
    await toast.promise(promise(), {
        loading: 'Adding to database...',
        success: 'Q&A added to the knowledge base!',
        error: 'Failed to add Q&A.',
    });
};

const deleteUnansweredQuestion = async (questionId: number): Promise<void> => {
    await delay(100);
    getStore().actions.deleteUnansweredQuestionFromCurrentBot(questionId);
};

const addChannel = async (type: ChannelType): Promise<void> => {
    const promise = async () => {
        await delay(500);
        const newChannel: IntegrationChannel = {
          id: `channel_${Date.now()}`,
          type,
          isEnabled: false,
          webhookUrl: `https://api.your-service.com/wh/${crypto.randomUUID()}`,
          clientId: `client_${Date.now()}`,
          clientSecret: `sk_live_${crypto.randomUUID()}`,
          allowedOrigins: [],
        };
        getStore().actions.addChannelToCurrentBot(newChannel);
    };
    await toast.promise(promise(), {
        loading: 'Adding channel...',
        success: `Channel ${type} added successfully!`,
        error: 'Failed to add channel.',
    });
}

// --- NEW/UPDATED FUNCTIONS ---
const apiUpdateQaItem = async (item: QAItem): Promise<void> => {
    const updatePromise = async () => {
      await delay(500);
      const { actions, currentBotId } = getStore();
      const bot = getStore().bots.find(b => b.id === currentBotId);
      if (!bot) throw new Error("Bot not found");
      
      const updatedQaData = bot.qaDatabase.map(i => i.id === item.id ? item : i);
      actions.updateCurrentBot({ qaDatabase: updatedQaData });
    };
  
    await toast.promise(updatePromise(), {
      loading: 'Updating...',
      success: 'Record updated successfully!',
      error: 'Error updating record.',
    });
};

const apiDeleteQaItem = async (id: number): Promise<void> => {
    const deletePromise = async () => {
      await delay(500);
      const { actions, currentBotId } = getStore();
      const bot = getStore().bots.find(b => b.id === currentBotId);
      if (!bot) throw new Error("Bot not found");
      
      const updatedQaData = bot.qaDatabase.filter(item => item.id !== id);
      actions.updateCurrentBot({ qaDatabase: updatedQaData });
    };
  
    await toast.promise(deletePromise(), {
      loading: 'Deleting...',
      success: 'Record deleted successfully!',
      error: 'Error deleting record.',
    });
};

const apiUpdateFile = async (file: UploadedFile): Promise<void> => {
    const updatePromise = async () => {
        await delay(500);
        const { actions, currentBotId } = getStore();
        const bot = getStore().bots.find(b => b.id === currentBotId);
        if (!bot) throw new Error("Bot not found");

        const updatedFiles = bot.uploadedFiles.map(f => f.id === file.id ? file : f);
        actions.updateCurrentBot({ uploadedFiles: updatedFiles });
    };

    await toast.promise(updatePromise(), {
        loading: 'Updating file...',
        success: 'File updated successfully!',
        error: 'Failed to update file.',
    });
};

const apiDeleteFile = async (id: number): Promise<void> => {
    const deletePromise = async () => {
        await delay(500);
        const { actions, currentBotId } = getStore();
        const bot = getStore().bots.find(b => b.id === currentBotId);
        if (!bot) throw new Error("Bot not found");

        const updatedFiles = bot.uploadedFiles.filter(f => f.id !== id);
        actions.updateCurrentBot({ uploadedFiles: updatedFiles });
    };

    await toast.promise(deletePromise(), {
        loading: 'Deleting file...',
        success: 'File deleted successfully!',
        error: 'Failed to delete file.',
    });
};

const apiExportQA = async (): Promise<void> => {
    const exportPromise = async () => {
        await delay(300);
        const bot = getStore().bots.find(b => b.id === getStore().currentBotId);
        if (!bot || bot.qaDatabase.length === 0) throw new Error("No data to export");
        console.log(JSON.stringify(bot.qaDatabase, null, 2));
    };
     await toast.promise(exportPromise(), {
        loading: 'Exporting...',
        success: 'Export successful! Check the console.',
        error: (err) => err.message,
    });
};

const apiImportQA = async (file: File): Promise<void> => {
    const importPromise = async () => {
        await delay(500);
        console.log(`Simulating import for file: ${file.name}`);
        // In a real app, you would parse the file and update the store.
    };
    await toast.promise(importPromise(), {
        loading: 'Importing...',
        success: 'Import finished successfully!',
        error: 'Import failed.',
    });
};

const apiConvertUnansweredToQA = async (item: UnansweredQuestion, answer: string): Promise<void> => {
    const convertPromise = async () => {
        await delay(400);
        const { actions, currentBotId } = getStore();
        const bot = getStore().bots.find(b => b.id === currentBotId);
        if (!bot) throw new Error("Bot not found");

        // Prepare new data
        const newQaItem: QAItem = { id: Date.now(), question: item.question, answer, tags: item.tags };
        const updatedQaDb = [...bot.qaDatabase, newQaItem];
        const updatedUnanswered = bot.unansweredQuestions.filter(q => q.id !== item.id);

        // Update state in one go
        actions.updateCurrentBot({
            qaDatabase: updatedQaDb,
            unansweredQuestions: updatedUnanswered
        });
    };
    await toast.promise(convertPromise(), {
        loading: 'Converting...',
        success: 'Added to knowledge base!',
        error: 'Failed to convert question.',
    });
};

const apiExportData = (data: any[], filename: string) => {
    try {
      exportService.downloadCSV(data, filename);
      toast.success('Export started!');
    } catch (e) {
      toast.error('Export failed.');
    }
};

const reindexRag = async (): Promise<void> => {
    await toast.promise(delay(2000), {
        loading: 'Starting RAG re-indexing...',
        success: 'Re-indexing process initiated successfully!',
        error: 'Failed to start re-indexing.',
    })
};

export const apiService = {
    login,
    getCredentials, // NEW
    addCredential, // NEW
    updateCredential, // NEW
    deleteCredential, // NEW
    getBots,
    addBot,
    deleteBot,
    updateBot,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    postChatMessage,
    updateBotSettings,
    getTagsForQuestion,
    addQaItem,
    deleteUnansweredQuestion,
    addChannel,
    apiUpdateQaItem,
    apiDeleteQaItem,
    apiUpdateFile,
    apiDeleteFile,
    apiExportQA,
    apiImportQA,
    apiConvertUnansweredToQA,
    apiExportData,
    reindexRag, // NEW
};