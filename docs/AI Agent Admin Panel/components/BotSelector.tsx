
import React from 'react';
import { useVisibleBots, useCurrentBotId, useStoreActions } from '../store/useAppStore';
import { RobotIcon, AddIcon } from './icons';

interface BotSelectorProps {
    onManageBots: () => void;
}

const BotSelector: React.FC<BotSelectorProps> = ({ onManageBots }) => {
    const bots = useVisibleBots();
    const currentBotId = useCurrentBotId();
    const { setCurrentBotId } = useStoreActions();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center mb-4 sm:mb-0">
                <RobotIcon className="w-8 h-8 text-primary-500 mr-3"/>
                <select
                    id="bot-selector"
                    value={currentBotId || ''}
                    onChange={(e) => setCurrentBotId(e.target.value)}
                    className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base bg-white border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={bots.length === 0}
                >
                    {bots.length > 0 ? (
                         bots.map(bot => (
                            <option key={bot.id} value={bot.id}>
                                {bot.name}
                            </option>
                        ))
                    ) : (
                        <option>No bots available</option>
                    )}
                </select>
            </div>
            <button 
                onClick={onManageBots}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
            >
                <AddIcon className="w-5 h-5 mr-2 -ml-1" />
                Manage Bots
            </button>
        </div>
    );
};

export default BotSelector;