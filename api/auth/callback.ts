import type { VercelRequest, VercelResponse } from '@vercel/node';
import CryptoJS from 'crypto-js';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

/**
 * Encrypt access token for storage
 */
function encryptToken(token: string): string {
  const secret = process.env.ENCRYPTION_SECRET || process.env.GITHUB_CLIENT_SECRET || 'fallback-secret';
  return CryptoJS.AES.encrypt(token, secret).toString();
}

/**
 * GitHub OAuth Callback Handler
 * Exchanges code for access token and returns user info
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GitHub OAuth credentials not configured' });
  }

  // Get code and state from query or body
  const code = req.query.code as string || req.body?.code;
  // State parameter for CSRF protection (stored but not used in basic implementation)
  void (req.query.state as string || req.body?.state);

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json() as GitHubTokenResponse;

    if (!tokenData.access_token) {
      return res.status(400).json({ 
        error: 'Failed to obtain access token',
        details: tokenData 
      });
    }

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'notesh.md',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json() as GitHubUser;

    // Encrypt token for client-side storage
    const encryptedToken = encryptToken(tokenData.access_token);

    // Return success response
    return res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatar_url,
      },
      encryptedToken: encryptedToken,
      scope: tokenData.scope,
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
