import { create } from 'zustand';
import type { GitHubConfig, Note, SyncStatus } from '../types';

interface GitHubStore {
  config: GitHubConfig | null;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatus: SyncStatus;
  pendingChanges: Note[];
  setConfig: (config: GitHubConfig) => void;
  setConnected: (connected: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  addPendingChange: (note: Note) => void;
  clearPendingChanges: () => void;
  clearConfig: () => void;
}

export const useGitHubStore = create<GitHubStore>((set) => ({
  config: null,
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  syncStatus: {
    lastSyncTime: null,
    pendingChanges: 0,
    hasConflict: false
  },
  pendingChanges: [],
  setConfig: (config) => set({ config }),
  setConnected: (connected) => set({ isConnected: connected }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncTime: (time) => set({ lastSyncTime: time, syncStatus: { lastSyncTime: time, pendingChanges: 0, hasConflict: false } }),
  setSyncStatus: (status) => set((state) => ({ syncStatus: { ...state.syncStatus, ...status } })),
  addPendingChange: (note) => set((state) => ({ 
    pendingChanges: [...state.pendingChanges.filter((n) => n.id !== note.id), note],
    syncStatus: { ...state.syncStatus, pendingChanges: state.pendingChanges.length + 1 }
  })),
  clearPendingChanges: () => set({ pendingChanges: [], syncStatus: { lastSyncTime: null, pendingChanges: 0, hasConflict: false } }),
  clearConfig: () => set({ config: null, isConnected: false, pendingChanges: [], syncStatus: { lastSyncTime: null, pendingChanges: 0, hasConflict: false } })
}));