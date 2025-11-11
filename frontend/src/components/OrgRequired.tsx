import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '../stores/organizationStore';

interface OrgRequiredProps {
  children: React.ReactNode;
}

export const OrgRequired = ({ children }: OrgRequiredProps) => {
  const currentOrg = useOrganizationStore((state) => state.currentOrg);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentOrg) {
      navigate('/select-organization');
    }
  }, [currentOrg, navigate]);
  
  if (!currentOrg) {
    return null;
  }
  
  return <>{children}</>;
};
