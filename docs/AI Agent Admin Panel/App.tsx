import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginComponent from './components/Login';
import Navbar from './components/Navbar';
import BotSelector from './components/BotSelector';
import MainView from './components/MainView';
import { useCurrentUser } from './store/useAppStore';
import { type View } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <LoginComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row">
        <Navbar setView={setView} currentView={view} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 w-full overflow-auto h-screen flex flex-col">
          {view !== 'user-management' && view !== 'dashboard' && (
            <BotSelector
                onManageBots={() => setView('manage-bots')}
            />
           )}
          <div className="flex-grow mt-6">
             <MainView view={view} setView={setView} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;