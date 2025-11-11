
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useVisibleBots, useCurrentUser } from '../store/useAppStore';
import { type Bot } from '../types';
import { EditIcon, DeleteIcon, AddIcon } from './icons';

interface ManageBotsProps {
    setView: (view: string) => void;
}

const ManageBots: React.FC<ManageBotsProps> = ({ setView }) => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBotName, setNewBotName] = useState('');
    const [editingBot, setEditingBot] = useState<Bot | null>(null);
    const [editingName, setEditingName] = useState('');
    
    const currentUser = useCurrentUser();

    const fetchBots = async () => {
        setIsLoading(true);
        const fetchedBots = await apiService.getBots();
        setBots(fetchedBots);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchBots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleAddBot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBotName.trim()) return;
        await apiService.addBot(newBotName);
        setNewBotName('');
        await fetchBots();
    };

    const handleDeleteBot = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
            await apiService.deleteBot(id);
            await fetchBots();
        }
    };
    
    const handleUpdateBot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBot || !editingName.trim()) return;
        await apiService.updateBot(editingBot.id, { name: editingName });
        setEditingBot(null);
        setEditingName('');
        await fetchBots();
    };

    const startEditing = (bot: Bot) => {
        setEditingBot(bot);
        setEditingName(bot.name);
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Manage Bots</h2>

            <form onSubmit={handleAddBot} className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-4">
                <input
                    type="text"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="New bot name"
                    className="flex-grow p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                />
                <button type="submit" className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    <AddIcon className="w-5 h-5 mr-2" />
                    Create Bot
                </button>
            </form>

            <div className="space-y-3">
                {isLoading ? <p>Loading bots...</p> : bots.map(bot => (
                    <div key={bot.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                        {editingBot?.id === bot.id ? (
                            <form onSubmit={handleUpdateBot} className="flex-grow flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="flex-grow p-1 border bg-white border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                />
                                <button type="submit" className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full">Save</button>
                                <button type="button" onClick={() => setEditingBot(null)} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">Cancel</button>
                            </form>
                        ) : (
                            <>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{bot.name}</span>
                                <div className="space-x-2">
                                    <button onClick={() => startEditing(bot)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteBot(bot.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageBots;