import { Octokit } from '@octokit/rest';
import type { GitHubConfig, Note, GitHubFile } from '../types';

let octokit: Octokit | null = null;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000;

export function initGitHub(config: GitHubConfig): void {
  octokit = new Octokit({ auth: config.token });
}

export function getOctokit(): Octokit | null {
  return octokit;
}

export async function fetchNotesFromGitHub(owner: string, repo: string): Promise<Note[]> {
  if (!octokit) throw new Error('GitHub not initialized');
  
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'notes' });
    
    if (!Array.isArray(data)) return [];
    
    const notes: Note[] = [];
    
    for (const file of data as GitHubFile[]) {
      if (file.name.endsWith('.md')) continue;
      if (file.name.endsWith('.json')) {
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: `notes/${file.name}`
        });
        
        if (fileData && 'content' in fileData) {
          const content = atob(fileData.content);
          notes.push(JSON.parse(content));
        }
      }
    }
    
    return notes;
  } catch {
    return [];
  }
}

export async function uploadNoteToGitHub(
  owner: string, 
  repo: string, 
  note: Note
): Promise<{ success: boolean; sha?: string; error?: string }> {
  if (!octokit) throw new Error('GitHub not initialized');
  
  const content = JSON.stringify(note, null, 2);
  const path = `notes/${note.id}.json`;
  
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    
    if (data && 'sha' in data) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Update note: ${note.title}`,
        content: btoa(content),
        sha: data.sha
      });
      return { success: true, sha: data.sha };
    } else {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Create note: ${note.title}`,
        content: btoa(content)
      });
      return { success: true, sha: response.data.content?.sha };
    }
  } catch {
    try {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Create note: ${note.title}`,
        content: btoa(content)
      });
      return { success: true, sha: response.data.content?.sha };
    } catch (createError) {
      return { success: false, error: String(createError) };
    }
  }
}

export async function deleteNoteFromGitHub(
  owner: string, 
  repo: string, 
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  if (!octokit) throw new Error('GitHub not initialized');
  
  const path = `notes/${noteId}.json`;
  
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    
    if (data && 'sha' in data) {
      await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message: `Delete note: ${noteId}`,
        sha: data.sha
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function checkForConflicts(
  owner: string,
  repo: string,
  localNote: Note
): Promise<{ hasConflict: boolean; remoteNote?: Note }> {
  if (!octokit) throw new Error('GitHub not initialized');
  
  const path = `notes/${localNote.id}.json`;
  
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    
    if (data && 'sha' in data && 'content' in data) {
      const content = atob(data.content);
      const remoteNote = JSON.parse(content) as Note;
      
      if (remoteNote.updatedAt !== localNote.updatedAt) {
        return { hasConflict: true, remoteNote };
      }
    }
  } catch {
    // File doesn't exist on remote, no conflict
  }
  
  return { hasConflict: false };
}

export async function syncAllNotes(
  owner: string,
  repo: string,
  notes: Note[],
  onProgress?: (note: Note, success: boolean) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const note of notes) {
    const result = await uploadNoteToGitHub(owner, repo, note);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
    onProgress?.(note, result.success);
  }
  
  return { success, failed };
}

export function debouncedSync(
  owner: string,
  repo: string,
  note: Note,
  syncFn: typeof uploadNoteToGitHub
): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    await syncFn(owner, repo, note);
  }, SYNC_DEBOUNCE_MS);
}

export async function resolveConflict(
  owner: string,
  repo: string,
  note: Note,
  resolution: 'local' | 'remote',
  remoteNote?: Note
): Promise<Note> {
  if (resolution === 'remote' && remoteNote) {
    return remoteNote;
  }
  
  await uploadNoteToGitHub(owner, repo, note);
  return note;
}