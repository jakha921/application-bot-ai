import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import {
  DashboardIcon,
  RobotIcon,
  ChatIcon,
  TemplateIcon,
  SettingsIcon,
  UsersIcon,
  LogoutIcon,
  MonitoringIcon,
  BookOpenIcon,
  ShieldCheckIcon,
} from './icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Дашборд', icon: DashboardIcon },
  { path: '/bots', label: 'Боты', icon: RobotIcon },
  { path: '/bot-chat', label: 'Тест чата', icon: ChatIcon },
  { path: '/knowledge', label: 'База знаний', icon: BookOpenIcon },
  { path: '/organization-settings', label: 'Организация', icon: ShieldCheckIcon },
  { path: '/templates', label: 'Шаблоны', icon: TemplateIcon },
  { path: '/monitoring', label: 'Мониторинг', icon: MonitoringIcon },
  { path: '/settings', label: 'Настройки', icon: SettingsIcon },
  { path: '/users', label: 'Пользователи', icon: UsersIcon },
];

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink = ({ item, isActive, onClick }: NavLinkProps) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary-500 text-white shadow-lg'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    <item.icon className="w-5 h-5 mr-3" />
    <span>{item.label}</span>
  </Link>
);

export const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-xl font-bold text-primary-600 dark:text-primary-400">
          <RobotIcon className="w-8 h-8 mr-2" />
          <span>Ariza AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center text-xl font-bold text-primary-600 dark:text-primary-400">
            <RobotIcon className="w-8 h-8 mr-2" />
            <span>Ariza AI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="mt-auto">
          <div className="flex items-center justify-between p-3 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'Member'}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            <LogoutIcon className="w-5 h-5 mr-3" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};
