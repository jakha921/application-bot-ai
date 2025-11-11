import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <div className="flex flex-col md:flex-row">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 w-full overflow-auto min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
