import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Processing GitHub login...');

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      // Verify state matches (CSRF protection)
      const storedState = sessionStorage.getItem('github_oauth_state');
      sessionStorage.removeItem('github_oauth_state');

      if (!code) {
        setError('No authorization code received from GitHub');
        return;
      }

      if (state && state !== storedState) {
        setError('Invalid state parameter. Possible CSRF attack.');
        return;
      }

      try {
        setStatus('Exchanging code for access token...');
        
        const response = await fetch(`/api/auth/callback?code=${code}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Authentication failed');
        }

        // Store encrypted token and user data
        localStorage.setItem('github_token', data.encryptedToken);
        localStorage.setItem('github_user', JSON.stringify(data.user));

        setStatus('Login successful! Redirecting...');
        
        // Redirect to settings page
        setTimeout(() => {
          navigate('/settings');
        }, 1000);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    processCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>❌ Login Failed</h2>
        <p style={{ color: '#aaa', marginBottom: '2rem' }}>{error}</p>
        <button 
          onClick={() => navigate('/settings')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#4a90d9',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Settings
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid #333',
        borderTop: '3px solid #4a90d9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h2 style={{ marginBottom: '0.5rem' }}>🔗 Connecting to GitHub</h2>
      <p style={{ color: '#888' }}>{status}</p>
    </div>
  );
}
