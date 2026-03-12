import { useState, useEffect } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { githubService, type Repository } from '../services/github';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

export function Settings() {
  const { notes, setNotes } = useNoteStore();
  
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; failed: number } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const encryptedToken = localStorage.getItem('github_token');
    const savedUser = localStorage.getItem('github_user');
    const savedRepo = localStorage.getItem('github_repo');
    
    if (encryptedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsConnected(true);
        githubService.setEncryptedToken(encryptedToken);
        
        if (savedRepo) {
          setSelectedRepo(savedRepo);
        }
        
        // Load repos
        loadRepos();
      } catch {
        // Invalid stored data, clear it
        handleDisconnect();
      }
    }
  }, []);

  const loadRepos = async () => {
    try {
      const repoList = await githubService.listRepositories();
      setRepos(repoList);
    } catch (err) {
      console.error('Failed to load repos:', err);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate and store state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('github_oauth_state', state);
      
      const authUrl = await githubService.initiateAuth();
      // Redirect to GitHub OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initialize GitHub login');
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('github_repo');
    setUser(null);
    setRepos([]);
    setSelectedRepo('');
    setIsConnected(false);
    githubService.clearToken();
  };

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    localStorage.setItem('github_repo', repoFullName);
  };

  const handleCreateRepo = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newRepo = await githubService.createRepository('notesh-md-notes', 'My notes from notesh.md', false);
      setRepos([...repos, newRepo]);
      setSelectedRepo(newRepo.fullName);
      localStorage.setItem('github_repo', newRepo.fullName);
    } catch (err) {
      setError('Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedRepo) {
      setError('Please select a repository first');
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    setSyncStatus(null);
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      
      let synced = 0;
      let failed = 0;
      
      for (const note of notes) {
        try {
          await githubService.saveNote(owner, repo, {
            title: note.title,
            content: note.content,
            tags: note.tags,
            filename: `${note.title.toLowerCase().replace(/\s+/g, '-')}.md`
          });
          synced++;
        } catch {
          failed++;
        }
      }
      
      setSyncStatus({ synced, failed });
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setError('Sync failed: ' + String(err instanceof Error ? err.message : err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedRepo) {
      setError('Please select a repository first');
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      const remoteNotes = await githubService.listNotes(owner, repo);
      
      // Convert GitHub notes to app format
      const convertedNotes = remoteNotes.map(note => ({
        id: note.id || crypto.randomUUID(),
        title: note.metadata.title || note.title,
        content: note.content,
        tags: note.metadata.tags || [],
        createdAt: note.metadata.created || new Date().toISOString(),
        updatedAt: note.metadata.updated || new Date().toISOString(),
        linkedNotes: []
      }));
      
      // Merge with local notes
      const existingIds = new Set(notes.map(n => n.id));
      const newNotes = convertedNotes.filter(n => !existingIds.has(n.id));
      
      setNotes([...notes, ...newNotes]);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setError('Import failed: ' + String(err instanceof Error ? err.message : err));
    } finally {
      setIsSyncing(false);
    }
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
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Connect your GitHub account to sync notes across devices.
            </p>
            <button 
              onClick={handleLogin} 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : '🔗 Login with GitHub'}
            </button>
          </div>
        ) : (
          <div className="connected-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {user?.avatarUrl && (
                <img 
                  src={user.avatarUrl} 
                  alt={user.login}
                  style={{ width: 48, height: 48, borderRadius: '50%' }}
                />
              )}
              <div>
                <p style={{ fontWeight: 600 }}>{user?.name || user?.login}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  @{user?.login}
                </p>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Select Repository</label>
              <select
                value={selectedRepo}
                onChange={(e) => handleRepoSelect(e.target.value)}
                disabled={isSyncing}
              >
                <option value="">Choose a repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName} {repo.private ? '(private)' : '(public)'}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleCreateRepo} 
                className="btn-secondary"
                disabled={isLoading}
                style={{ marginTop: '0.5rem' }}
              >
                {isLoading ? 'Creating...' : '+ Create new notes repo'}
              </button>
            </div>
            
            {lastSyncTime && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Last synced: {new Date(lastSyncTime).toLocaleString()}
              </p>
            )}
            
            {syncStatus && (
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {syncStatus.synced} synced, {syncStatus.failed} failed
              </p>
            )}
            
            <div className="button-group">
              <button 
                onClick={handleSync} 
                disabled={isSyncing || !selectedRepo} 
                className="btn-primary"
              >
                {isSyncing ? 'Syncing...' : '☁️ Sync to GitHub'}
              </button>
              <button 
                onClick={handleImport} 
                disabled={isSyncing || !selectedRepo} 
                className="btn-secondary"
              >
                📥 Import from GitHub
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
    </div>
  );
}
