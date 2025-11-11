import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useOrganizationStore } from '../stores/organizationStore';

export const MainLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentOrg = useOrganizationStore((state) => state.currentOrg);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Ariza AI SaaS</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/bots" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Боты
                </Link>
                <Link to="/templates" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Шаблоны
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {currentOrg && (
                <div className="text-sm">
                  <span className="text-gray-500">Организация:</span>{' '}
                  <span className="font-medium">{currentOrg.name}</span>
                </div>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
