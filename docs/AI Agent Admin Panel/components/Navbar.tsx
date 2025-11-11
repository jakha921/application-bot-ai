import React, { useState } from 'react';
import { useCurrentUser, useStoreActions } from '../store/useAppStore';
import { type View, type User, Role } from '../types';
import {
  DashboardIcon,
  ChatIcon,
  DatabaseIcon,
  UploadIcon,
  UnansweredIcon,
  MonitoringIcon,
  SettingsIcon,
  UsersIcon,
  LogoutIcon,
  RobotIcon,
  KeyIcon, // NEW
} from './icons';
import ThemeToggle from './ThemeToggle';

interface NavItem {
  view: View;
  label: string;
  icon: React.FC<{ className?: string }>;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Analytics', icon: DashboardIcon },
  { view: 'chatbot', label: 'Chatbot', icon: ChatIcon },
  { view: 'database', label: 'Q&A Database', icon: DatabaseIcon, allowedRoles: ['admin', 'client-admin', 'client-editor'] },
  { view: 'upload', label: 'Upload Materials', icon: UploadIcon, allowedRoles: ['admin', 'client-admin', 'client-editor'] },
  { view: 'unanswered', label: 'Unanswered', icon: UnansweredIcon, allowedRoles: ['admin', 'client-admin', 'client-editor'] },
  { view: 'monitoring', label: 'Monitoring', icon: MonitoringIcon },
  { view: 'settings', label: 'Settings', icon: SettingsIcon, allowedRoles: ['admin', 'client-admin'] },
  { view: 'user-management', label: 'Users', icon: UsersIcon, allowedRoles: ['admin'] },
  { view: 'key-vault', label: 'Key Vault', icon: KeyIcon, allowedRoles: ['admin'] }, // NEW
];

interface NavbarProps {
  setView: (view: View) => void;
  currentView: View;
}

const NavLink: React.FC<{
  item: NavItem;
  currentView: View;
  onClick: (view: View) => void;
}> = ({ item, currentView, onClick }) => (
    <button
        onClick={() => onClick(item.view)}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        currentView === item.view
            ? 'bg-primary-500 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        <item.icon className="w-5 h-5 mr-3" />
        <span>{item.label}</span>
    </button>
);

const Navbar: React.FC<NavbarProps> = ({ setView, currentView }) => {
  const currentUser = useCurrentUser() as User;
  const { logout } = useStoreActions();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const visibleNavItems = navItems.filter(item => !item.allowedRoles || item.allowedRoles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-xl font-bold text-primary-600 dark:text-primary-400">
          <RobotIcon className="w-8 h-8 mr-2" />
          <span>AI Panel</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center text-xl font-bold text-primary-600 dark:text-primary-400">
                <RobotIcon className="w-8 h-8 mr-2" />
                <span>AI Panel</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <nav className="flex-grow space-y-2">
          {visibleNavItems.map(item => (
            <NavLink key={item.view} item={item} currentView={currentView} onClick={view => { setView(view); setMobileMenuOpen(false); }} />
          ))}
        </nav>

        <div className="mt-auto">
            <div className="flex items-center justify-between p-3 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
                </div>
                <ThemeToggle />
            </div>
            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
            >
                <LogoutIcon className="w-5 h-5 mr-3" />
                <span>Logout</span>
            </button>
        </div>
      </aside>
       {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
    </>
  );
};

export default Navbar;