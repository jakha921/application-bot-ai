import React from 'react';
import { type View } from '../types';
import { useCurrentBotData, useCurrentUser } from '../store/useAppStore';
import Dashboard from './Dashboard'; // NEW
import QADatabase from './QADatabase';
import UploadMaterials from './UploadMaterials';
import UnansweredQuestions from './UnansweredQuestions';
import Chatbot from './Chatbot';
import Monitoring from './Monitoring';
import Settings from './Settings';
import ManageBots from './ManageBots';
import UserManagement from './UserManagement';
import KeyVaultManagement from './KeyVaultManagement'; // NEW
import { RobotIcon } from './icons';

interface MainViewProps {
  view: View;
  setView: (view: View) => void;
}

const MainView: React.FC<MainViewProps> = ({ view, setView }) => {
  const currentUser = useCurrentUser();
  const currentBot = useCurrentBotData();

  const renderAdminView = (view: View) => {
    if (currentUser?.role !== 'admin') {
      return <div className="text-center p-8 text-red-500">Access Denied.</div>;
    }
    switch (view) {
      case 'user-management':
        return <UserManagement />;
      case 'key-vault':
        return <KeyVaultManagement />;
      default:
        return <div className="text-center p-8 text-red-500">Invalid Admin View.</div>;
    }
  };

  if (view === 'user-management' || view === 'key-vault') {
      return renderAdminView(view);
  }

  if (view === 'manage-bots') {
    return <ManageBots setView={setView} />;
  }
  
  if (view === 'dashboard') {
    return <Dashboard />;
  }

  if (!currentBot) {
     return (
       <div className="text-center p-8 flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <RobotIcon className="w-24 h-24 text-primary-400 mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">No Bot Selected</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Please create or select a bot to start working.</p>
          <button
            onClick={() => setView('manage-bots')}
            className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Manage Bots
          </button>
       </div>
     );
  }

  switch (view) {
    case 'database':
      return <QADatabase key={currentBot.id} />;
    case 'upload':
      return <UploadMaterials key={currentBot.id} />;
    case 'unanswered':
      return <UnansweredQuestions key={currentBot.id} />;
    case 'chatbot':
      return <Chatbot key={currentBot.id} />;
    case 'monitoring':
      return <Monitoring key={currentBot.id} />;
    case 'settings':
      return <Settings key={currentBot.id} />;
    default:
      return <Dashboard />; // Fallback to dashboard
  }
};

export default MainView;