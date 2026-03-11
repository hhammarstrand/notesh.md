import { useState } from 'react';
import { useGitHubStore } from '../stores/githubStore';
import { useNoteStore } from '../stores/noteStore';
import { initGitHub, fetchNotesFromGitHub, uploadNoteToGitHub, checkForConflicts, syncAllNotes } from '../lib/github';
import type { Note } from '../types';

export function Settings() {
  const { config, isConnected, isSyncing, lastSyncTime, syncStatus, setConfig, setConnected, setSyncing, setLastSyncTime, setSyncStatus, clearConfig } = useGitHubStore();
  const { notes, setNotes } = useNoteStore();
  
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<{ local: Note; remote: Note } | null>(null);
  
  const handleConnect = async () => {
    if (!token || !owner || !repo) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const newConfig = { token, owner, repo };
      setConfig(newConfig);
      initGitHub(newConfig);
      setConnected(true);
      setError(null);
    } catch {
      setError('Failed to connect to GitHub');
    }
  };
  
  const handleDisconnect = () => {
    clearConfig();
  };
  
  const handleSync = async () => {
    if (!config) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      const result = await syncAllNotes(config.owner, config.repo, notes);
      if (result.failed > 0) {
        setError(`Sync completed with ${result.failed} errors`);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setError('Sync failed: ' + String(err instanceof Error ? err.message : err));
    }
    
    setSyncing(false);
  };
  
  const handleImport = async () => {
    if (!config) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      for (const note of notes) {
        const conflict = await checkForConflicts(config.owner, config.repo, note);
        if (conflict.hasConflict && conflict.remoteNote) {
          setConflictData({ local: note, remote: conflict.remoteNote });
          setShowConflict(true);
          setSyncStatus({ hasConflict: true, conflictData: { local: note, remote: conflict.remoteNote } });
          break;
        }
      }
      
      if (!showConflict) {
        const importedNotes = await fetchNotesFromGitHub(config.owner, config.repo);
        setNotes(importedNotes);
        setLastSyncTime(new Date().toISOString());
      }
    } catch (err) {
      setError('Import failed: ' + String(err instanceof Error ? err.message : err));
    }
    
    setSyncing(false);
  };
  
  const resolveConflict = async (resolution: 'local' | 'remote') => {
    if (!config || !conflictData) return;
    
    const note = resolution === 'local' ? conflictData.local : conflictData.remote;
    
    try {
      await uploadNoteToGitHub(config.owner, config.repo, note);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setError('Failed to resolve conflict: ' + String(err instanceof Error ? err.message : err));
    }
    
    setShowConflict(false);
    setConflictData(null);
    setSyncStatus({ hasConflict: false });
  };
  
  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      {error && (
        <div className="toast toast-error" style={{ position: 'relative', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      <section className="settings-section">
        <h3>GitHub Sync</h3>
        
        {!isConnected ? (
          <div className="settings-form">
            <div className="form-group">
              <label>Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
              />
            </div>
            <div className="form-group">
              <label>Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label>Repository</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="my-notes"
              />
            </div>
            <button onClick={handleConnect} className="btn-primary">
              Connect
            </button>
          </div>
        ) : (
          <div className="connected-info">
            <p>Connected to: {config?.owner}/{config?.repo}</p>
            {lastSyncTime && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Last synced: {new Date(lastSyncTime).toLocaleString()}
              </p>
            )}
            {syncStatus.pendingChanges > 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--warning)' }}>
                {syncStatus.pendingChanges} pending changes
              </p>
            )}
            <div className="button-group">
              <button onClick={handleSync} disabled={isSyncing} className="btn-primary">
                {isSyncing ? 'Syncing...' : 'Sync Notes'}
              </button>
              <button onClick={handleImport} disabled={isSyncing} className="btn-secondary">
                Import
              </button>
              <button onClick={handleDisconnect} className="btn-danger">
                Disconnect
              </button>
            </div>
          </div>
        )}
      </section>
      
      <section className="settings-section">
        <h3>About</h3>
        <p>notesh.md - A modern note-taking app with graph view</p>
        <p className="version">Version 1.0.0</p>
      </section>
      
      {showConflict && conflictData && (
        <div className="conflict-modal">
          <div className="conflict-content">
            <h3>Conflict Detected</h3>
            <p>A conflict was detected for note: <strong>{conflictData.local.title}</strong></p>
            <p>Local version: {new Date(conflictData.local.updatedAt).toLocaleString()}</p>
            <p>Remote version: {new Date(conflictData.remote.updatedAt).toLocaleString()}</p>
            <div className="conflict-buttons">
              <button 
                className="btn-primary" 
                onClick={() => resolveConflict('local')}
              >
                Keep Local
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => resolveConflict('remote')}
              >
                Keep Remote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}