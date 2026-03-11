export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  linkedNotes: string[];
}

export interface NoteLink {
  source: string;
  target: string;
}

export interface Backlink {
  sourceNoteId: string;
  sourceNoteTitle: string;
  context: string;
}

export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  sha?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  execute: (content: string) => PluginResult;
}

export interface PluginResult {
  stats: Record<string, number | string>;
  html?: string;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingChanges: number;
  hasConflict: boolean;
  conflictData?: {
    local: Note;
    remote: Note;
  };
}

export type Theme = 'light' | 'dark' | 'system';