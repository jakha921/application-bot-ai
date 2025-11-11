import React, { useState, useEffect, useMemo } from 'react';
import { type Bot, type ModelConfig, type ModelProvider, type IntegrationChannel, type ChannelType } from '../types';
import { apiService } from '../services/apiService';
import { useCurrentBotData, useCurrentUser, useCredentialVault } from '../store/useAppStore';
import { DeleteIcon, AddIcon, EyeIcon, EyeOffIcon, InstagramIcon, WebWidgetIcon, SaveIcon, RobotIcon, BrainIcon, SearchIcon } from './icons';

type SettingsTab = 'general' | 'models' | 'rag' | 'finetune' | 'channels';

// --- Helper & Sub-Components ---

const TabButton: React.FC<{
    label: string;
    tabName: SettingsTab;
    activeTab: SettingsTab;
    onClick: (tab: SettingsTab) => void;
}> = ({ label, tabName, activeTab, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabName
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {label}
    </button>
);

const ModelConfigItem: React.FC<{
  model: ModelConfig;
  onUpdate: (model: ModelConfig) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}> = ({ model, onUpdate, onDelete, onSetDefault }) => {
    const vault = useCredentialVault();
    const availableCredentials = useMemo(() => vault.filter(c => c.provider === model.provider), [vault, model.provider]);
    
    return (
    <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
      <select value={model.provider} onChange={(e) => onUpdate({ ...model, provider: e.target.value as ModelProvider, credentialId: '' })} className="col-span-1 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400">
        <option value="gemini">Gemini</option>
        <option value="openai">OpenAI</option>
        <option value="custom">Custom</option>
      </select>
      <input type="text" placeholder="Model Name (e.g., gpt-4o)" value={model.modelName} onChange={(e) => onUpdate({ ...model, modelName: e.target.value })} className="col-span-2 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
      <select value={model.credentialId} onChange={(e) => onUpdate({ ...model, credentialId: e.target.value })} className="col-span-2 block w-full rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400">
        <option value="">Select Credential...</option>
        {availableCredentials.map(cred => <option key={cred.id} value={cred.id}>{cred.name}</option>)}
      </select>
      <div className="col-span-1 md:col-span-5 flex items-center justify-between mt-2">
        <button type="button" onClick={() => onSetDefault(model.id)} disabled={model.isDefault} className="text-sm font-medium text-primary-600 dark:text-primary-400 disabled:text-gray-400 disabled:cursor-not-allowed">
            {model.isDefault ? 'Default' : 'Set as Default'}
        </button>
        <button type="button" onClick={() => onDelete(model.id)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><DeleteIcon className="w-5 h-5"/></button>
      </div>
    </div>
    )
};

const ChannelIcon: React.FC<{type: ChannelType, className?: string}> = ({ type, className }) => {
    switch (type) {
        case 'telegram': return <RobotIcon className={className} />; // Placeholder
        case 'instagram': return <InstagramIcon className={className} />;
        case 'web_widget': return <WebWidgetIcon className={className} />;
        default: return <RobotIcon className={className} />;
    }
};

const getChannelName = (type: ChannelType) => {
    switch(type) {
        case 'telegram': return 'Telegram';
        case 'instagram': return 'Instagram';
        case 'web_widget': return 'Web Widget';
    }
}

const IntegrationChannelItem: React.FC<{
    channel: IntegrationChannel;
    onUpdate: (channel: IntegrationChannel) => void;
    onDelete: (id: string) => void;
}> = ({ channel, onUpdate, onDelete }) => {
    const [secretVisible, setSecretVisible] = useState(false);
    const [tokenVisible, setTokenVisible] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    }
    
    return (
        <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ChannelIcon type={channel.type} className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{getChannelName(channel.type)}</span>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={channel.isEnabled} onChange={(e) => onUpdate({...channel, isEnabled: e.target.checked})} />
                            <div className={`block w-10 h-6 rounded-full transition ${channel.isEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${channel.isEnabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                    <button type="button" onClick={() => onDelete(channel.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><DeleteIcon className="w-5 h-5" /></button>
                </div>
            </div>
            
            {channel.type === 'telegram' && (
                 <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Telegram Bot Token</label>
                    <div className="flex mt-1 relative">
                        <input type={tokenVisible ? 'text' : 'password'} value={channel.telegramBotToken || ''} onChange={(e) => onUpdate({...channel, telegramBotToken: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                        <button type="button" onClick={() => setTokenVisible(!tokenVisible)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                            {tokenVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
            )}
            
            {channel.type === 'web_widget' && (
                <div className="space-y-3">
                     <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Client ID</label>
                        <div className="flex mt-1">
                            <input type="text" readOnly value={channel.clientId} className="w-full rounded-l-md border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                            <button type="button" onClick={() => copyToClipboard(channel.clientId)} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md">Copy</button>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Client Secret</label>
                        <div className="flex mt-1 relative">
                            <input type={secretVisible ? 'text' : 'password'} readOnly value={channel.clientSecret} className="w-full rounded-l-md border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                            <button type="button" onClick={() => setSecretVisible(!secretVisible)} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 border border-y border-x-0 border-gray-300 dark:border-gray-600">
                                {secretVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                            </button>
                            <button type="button" onClick={() => copyToClipboard(channel.clientSecret)} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md">Copy</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Allowed Origins (comma-separated)</label>
                        <input type="text" value={channel.allowedOrigins.join(', ')} onChange={e => onUpdate({...channel, allowedOrigins: e.target.value.split(',').map(o => o.trim()).filter(Boolean)})} className="mt-1 w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Settings Component ---
const Settings: React.FC = () => {
    const currentBot = useCurrentBotData();
    const currentUser = useCurrentUser();
    const [formData, setFormData] = useState<Partial<Bot>>({});
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    useEffect(() => {
        if (currentBot) {
            setFormData({
                name: currentBot.name,
                systemInstruction: currentBot.systemInstruction,
                isSearchGroundingEnabled: currentBot.isSearchGroundingEnabled,
                modelConfigurations: currentBot.modelConfigurations,
                integrationChannels: currentBot.integrationChannels,
            });
        }
    }, [currentBot]);

  if (!currentBot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiService.updateBotSettings(formData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(p => ({ ...p, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };
  
  const handleModelChange = (updatedModel: ModelConfig) => setFormData(p => ({...p, modelConfigurations: p.modelConfigurations?.map(m => m.id === updatedModel.id ? updatedModel : m)}));
  const handleModelDelete = (id: string) => {
    if (formData.modelConfigurations && formData.modelConfigurations.length <= 1) { alert("At least one model must be configured."); return; }
    setFormData(p => ({...p, modelConfigurations: p.modelConfigurations?.filter(m => m.id !== id)}));
  };
  const handleSetDefault = (id: string) => setFormData(p => ({...p, modelConfigurations: p.modelConfigurations?.map(m => ({...m, isDefault: m.id === id}))}));
  const handleAddModel = () => {
    const newModel: ModelConfig = { id: `model_${Date.now()}`, provider: 'gemini', modelName: 'gemini-2.5-flash', credentialId: '', isDefault: !formData.modelConfigurations || formData.modelConfigurations.length === 0 };
    setFormData(p => ({...p, modelConfigurations: [...(p.modelConfigurations || []), newModel]}));
  };

  const handleChannelUpdate = (updatedChannel: IntegrationChannel) => setFormData(p => ({...p, integrationChannels: p.integrationChannels?.map(c => c.id === updatedChannel.id ? updatedChannel : c)}));
  const handleChannelDelete = (id: string) => setFormData(p => ({...p, integrationChannels: p.integrationChannels?.filter(c => c.id !== id)}));
  const handleAddChannel = async (type: ChannelType | null) => {
      if (!type) return;
      await apiService.addChannel(type);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Bot Settings</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400">Manage configuration for "{currentBot.name}"</p>
        </div>
        
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            {/* Tabs Navigation */}
            <div className="w-full md:w-1/4 border-r dark:border-gray-700 p-4 space-y-2">
                <TabButton label="General" tabName="general" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton label="Models" tabName="models" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton label="Knowledge (RAG)" tabName="rag" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton label="Fine-Tune" tabName="finetune" activeTab={activeTab} onClick={setActiveTab} />
                {currentUser?.role === 'admin' && (
                    <TabButton label="Channels" tabName="channels" activeTab={activeTab} onClick={setActiveTab} />
                )}
            </div>
            
            {/* Tab Content */}
            <div className="w-full md:w-3/4 p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {activeTab === 'general' && (
                        <fieldset className="space-y-4">
                            <legend className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">General Settings</legend>
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Name</label>
                                <input name="name" id="name" value={formData.name || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
                            </div>
                            <div>
                                <label htmlFor="systemInstruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Instruction</label>
                                <textarea name="systemInstruction" id="systemInstruction" value={formData.systemInstruction || ''} onChange={handleInputChange} rows={8} className="mt-1 block w-full rounded-md shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">This is the core prompt that defines the bot's personality and instructions.</p>
                            </div>
                        </fieldset>
                    )}
                    
                    {activeTab === 'models' && (
                         <fieldset className="space-y-4">
                            <legend className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">AI Models</legend>
                            <div className="space-y-4 mb-4">{formData.modelConfigurations?.map(m => <ModelConfigItem key={m.id} model={m} onUpdate={handleModelChange} onDelete={handleModelDelete} onSetDefault={handleSetDefault}/>)}</div>
                            <button type="button" onClick={handleAddModel} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 border border-current rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"><AddIcon className="w-5 h-5"/>Add Model</button>
                        </fieldset>
                    )}
                    
                    {activeTab === 'rag' && (
                        <fieldset className="space-y-4">
                            <legend className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Knowledge (RAG)</legend>
                            <div className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex items-center">
                                    <input type="checkbox" name="isSearchGroundingEnabled" id="isSearchGroundingEnabled" checked={formData.isSearchGroundingEnabled || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
                                    <label htmlFor="isSearchGroundingEnabled" className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-200">Enable RAG</label>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Allows the bot to use uploaded documents to answer questions.</p>
                            </div>
                             <div className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-medium text-gray-900 dark:text-gray-200">Re-index Knowledge Base</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">If you've recently uploaded or changed many files, re-indexing ensures the bot has the latest information.</p>
                                <button type="button" onClick={() => apiService.reindexRag()} className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"><SearchIcon className="w-4 h-4"/>Re-index Now</button>
                            </div>
                        </fieldset>
                    )}

                    {activeTab === 'finetune' && (
                         <fieldset className="space-y-4">
                            <legend className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Fine-Tuning</legend>
                             <div className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-medium text-gray-900 dark:text-gray-200">Start a New Fine-Tuning Job</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Create a specialized model based on your Q&A data. Select tags to include in the training set.</p>
                                <div className="mt-3 max-h-32 overflow-y-auto space-y-2 p-2 border dark:border-gray-600 rounded">
                                    {['shipping', 'policy', 'returns', 'logistics', 'general'].map(tag => (
                                        <div key={tag} className="flex items-center">
                                             <input type="checkbox" id={`tag-${tag}`} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
                                             <label htmlFor={`tag-${tag}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300 capitalize">{tag}</label>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"><BrainIcon className="w-4 h-4"/>Start Fine-Tuning</button>
                            </div>
                        </fieldset>
                    )}
                    
                    {activeTab === 'channels' && currentUser?.role === 'admin' && (
                        <fieldset className="space-y-4">
                            <legend className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Channels & Integrations</legend>
                             <div className="space-y-4 mb-4">{formData.integrationChannels?.map(c => <IntegrationChannelItem key={c.id} channel={c} onUpdate={handleChannelUpdate} onDelete={handleChannelDelete} />)}</div>
                            <select onChange={(e) => handleAddChannel(e.target.value ? e.target.value as ChannelType : null)} value="" className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
                                <option value="">+ Add Channel</option>
                                <option value="telegram">Telegram</option>
                                <option value="instagram">Instagram</option>
                                <option value="web_widget">Web Widget</option>
                            </select>
                        </fieldset>
                    )}
                    
                    <div className="pt-5 flex justify-end">
                        <button type="submit" className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <SaveIcon className="w-5 h-5"/>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Settings;