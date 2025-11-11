import { useOrganizationStore } from '../stores/organizationStore';

interface OrgRequiredProps {
  children: React.ReactNode;
}

export const OrgRequired = ({ children }: OrgRequiredProps) => {
  const currentOrg = useOrganizationStore((state) => state.currentOrg);
  
  // Show loading or message if no org
  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Загрузка организации...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Пожалуйста, подождите
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};
