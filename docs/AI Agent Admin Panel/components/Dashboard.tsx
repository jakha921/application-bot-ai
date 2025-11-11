import React from 'react';
import { useCurrentBotData } from '../store/useAppStore';
import { DatabaseIcon, UnansweredIcon, UploadIcon, MonitoringIcon, RobotIcon, ChatIcon } from './icons';
import MockChart from './MockChart';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<{className?: string}> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center space-x-4">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const bot = useCurrentBotData();

    if (!bot) {
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <RobotIcon className="w-24 h-24 text-primary-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Welcome to the AI Agent Factory</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Select a bot from the dropdown to see its analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard for {bot.name}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget 1: KPIs */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Key Metrics</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard title="Total Q&A" value={bot.qaDatabase.length} icon={DatabaseIcon} />
                        <StatCard title="Unanswered" value={bot.unansweredQuestions.length} icon={UnansweredIcon} />
                        <StatCard title="RAG Files Ready" value={bot.uploadedFiles.filter(f => f.status === 'ready').length} icon={UploadIcon} />
                        <StatCard title="Total Dialogues" value={bot.conversationLogs.length} icon={MonitoringIcon} />
                     </div>
                </div>

                {/* Widget 2: Recent Dialogues */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Dialogues</h3>
                    <div className="space-y-3">
                        {bot.conversationLogs.slice(0, 3).map(log => (
                            <div key={log.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">Q: {log.question}</p>
                                <p className="text-gray-600 dark:text-gray-400 truncate">A: {log.answer}</p>
                            </div>
                        ))}
                         {bot.conversationLogs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No dialogues yet.</p>}
                    </div>
                </div>

                {/* Widget 3: Popular Tags */}
                <MockChart type="bar" title="Popular Tags"/>
                
                {/* Widget 4: Activity */}
                <MockChart type="line" title="Activity (30 days)"/>

            </div>
        </div>
    );
};

export default Dashboard;