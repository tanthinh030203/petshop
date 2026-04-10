import { create } from 'zustand';
import type { Branch } from '@/types';
import { branchService } from '@/services/branch.service';

interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  loading: boolean;
  setBranch: (branch: Branch | null) => void;
  fetchBranches: () => Promise<void>;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  currentBranch: null,
  loading: false,

  setBranch: (branch) => {
    set({ currentBranch: branch });
    if (branch) {
      localStorage.setItem('current_branch_id', String(branch.id));
    } else {
      localStorage.removeItem('current_branch_id');
    }
  },

  fetchBranches: async () => {
    set({ loading: true });
    try {
      const response = await branchService.getAll({ limit: 100 });
      const branches = response.data;
      set({ branches });

      // Restore previously selected branch
      const savedId = localStorage.getItem('current_branch_id');
      if (savedId) {
        const found = branches.find((b) => b.id === Number(savedId));
        if (found) {
          set({ currentBranch: found });
        }
      }
    } finally {
      set({ loading: false });
    }
  },
}));
