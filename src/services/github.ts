const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  metadata: {
    title: string;
    tags?: string[];
    created?: string;
    updated?: string;
    filename?: string;
    sha?: string;
    [key: string]: unknown;
  };
}

export interface AuthResponse {
  success: boolean;
  user: GitHubUser;
  encryptedToken: string;
  scope: string;
}

class GitHubService {
  private encryptedToken: string | null = null;
  private user: GitHubUser | null = null;

  constructor() {
    // Restore session from localStorage
    this.encryptedToken = localStorage.getItem('github_token');
    const userJson = localStorage.getItem('github_user');
    if (userJson) {
      try {
        this.user = JSON.parse(userJson);
      } catch {
        this.user = null;
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.encryptedToken;
  }

  /**
   * Get current user
   */
  getUser(): GitHubUser | null {
    return this.user;
  }

  /**
   * Get encrypted token
   */
  getToken(): string | null {
    return this.encryptedToken;
  }

  /**
   * Set encrypted token (for restoring session)
   */
  setEncryptedToken(token: string): void {
    this.encryptedToken = token;
  }

  /**
   * Clear token and logout
   */
  clearToken(): void {
    this.encryptedToken = null;
    this.user = null;
  }

  /**
   * Initiate GitHub OAuth flow
   */
  async initiateAuth(): Promise<string> {
    const response = await fetch(`${API_BASE}/api/auth/github`);
    if (!response.ok) {
      throw new Error('Failed to initiate authentication');
    }
    const data = await response.json();
    return data.authUrl;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data: AuthResponse = await response.json();
    
    // Store session
    this.encryptedToken = data.encryptedToken;
    this.user = data.user;
    localStorage.setItem('github_token', data.encryptedToken);
    localStorage.setItem('github_user', JSON.stringify(data.user));

    return data;
  }

  /**
   * Logout
   */
  logout(): void {
    this.encryptedToken = null;
    this.user = null;
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('selected_repo');
  }

  /**
   * Get auth headers for API requests
   */
  private getHeaders(): Record<string, string> {
    if (!this.encryptedToken) {
      throw new Error('Not authenticated');
    }
    return {
      'Authorization': `Bearer ${this.encryptedToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List user's repositories
   */
  async listRepositories(): Promise<Repository[]> {
    const response = await fetch(`${API_BASE}/api/repos`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch repositories');
    }

    const data = await response.json();
    return data.repositories;
  }

  /**
   * Create a new repository for notes
   */
  async createRepository(name: string, description?: string, isPrivate?: boolean): Promise<Repository> {
    const response = await fetch(`${API_BASE}/api/repos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description, private: isPrivate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create repository');
    }

    const data = await response.json();
    return data.repository;
  }

  /**
   * List notes from repository
   */
  async listNotes(owner: string, repo: string, path: string = 'notes'): Promise<Note[]> {
    const queryParams = new URLSearchParams({ owner, repo, path });
    const response = await fetch(`${API_BASE}/api/sync?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch notes');
    }

    const data = await response.json();
    return data.notes;
  }

  /**
   * Save a note to repository
   */
  async saveNote(
    owner: string,
    repo: string,
    note: { title: string; content: string; tags?: string[]; filename?: string },
    path: string = 'notes'
  ): Promise<Note> {
    const queryParams = new URLSearchParams({ owner, repo, path });
    const response = await fetch(`${API_BASE}/api/sync?${queryParams}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save note');
    }

    const data = await response.json();
    return data.note;
  }

  /**
   * Delete a note from repository
   */
  async deleteNote(
    owner: string,
    repo: string,
    filename: string,
    sha: string,
    path: string = 'notes'
  ): Promise<void> {
    const queryParams = new URLSearchParams({ owner, repo, path, filename, sha });
    const response = await fetch(`${API_BASE}/api/sync?${queryParams}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete note');
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();
export default githubService;
