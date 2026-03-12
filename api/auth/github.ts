import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GitHub OAuth Init Endpoint
 * Redirects user to GitHub OAuth authorization page
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID || '';

  // For now, allow deployment without credentials (user can add them later)
  if (!clientId) {
    console.warn('GITHUB_CLIENT_ID not configured - OAuth will not work');
  }

  // Get the frontend origin for redirect URI
  const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
  const redirectUri = `${origin}/api/auth/callback`;

  // Generate random state for CSRF protection
  const state = Buffer.from(Math.random().toString(36) + Date.now().toString(36)).toString('base64');

  // Store state in cookie for verification in callback
  res.setHeader('Set-Cookie', `github_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);

  // GitHub OAuth authorization URL
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  if (clientId) {
    githubAuthUrl.searchParams.append('client_id', clientId);
    githubAuthUrl.searchParams.append('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.append('scope', 'repo read:user');
    githubAuthUrl.searchParams.append('state', state);
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Return the authorization URL to the frontend
  return res.status(200).json({
    authUrl: githubAuthUrl.toString(),
    state: state // Also return state for clients that can't read cookies
  });
}
