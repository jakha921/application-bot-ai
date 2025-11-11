import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '../types';

interface OrganizationState {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  switchOrg: (orgId: string) => void;
  addOrganization: (org: Organization) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      organizations: [],
      
      setCurrentOrg: (org) => {
        localStorage.setItem('current_org_id', org.id);
        set({ currentOrg: org });
      },
      
      setOrganizations: (orgs) => set({ organizations: orgs }),
      
      switchOrg: (orgId) => {
        const org = get().organizations.find((o) => o.id === orgId);
        if (org) {
          get().setCurrentOrg(org);
        }
      },
      
      addOrganization: (org) => set((state) => ({
        organizations: [...state.organizations, org],
      })),
    }),
    {
      name: 'organization-storage',
    }
  )
);
