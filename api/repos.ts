import type { VercelRequest, VercelResponse } from '@vercel/node';
import CryptoJS from 'crypto-js';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
}

/**
 * Decrypt access token from client
 */
function decryptToken(encryptedToken: string): string {
  const secret = process.env.ENCRYPTION_SECRET || process.env.GITHUB_CLIENT_SECRET || 'fallback-secret';
  const bytes = CryptoJS.AES.decrypt(encryptedToken, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Repos API Handler
 * GET: List user's repositories
 * POST: Create a new repository for notes
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const encryptedToken = req.headers.authorization?.replace('Bearer ', '');
  if (!encryptedToken) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(encryptedToken);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'notesh.md',
    'Content-Type': 'application/json',
  };

  try {
    switch (req.method) {
      case 'GET': {
        // List user's repositories
        const page = parseInt(req.query.page as string) || 1;
        const perPage = parseInt(req.query.per_page as string) || 100;

        const response = await fetch(
          `https://api.github.com/user/repos?sort=updated&direction=desc&page=${page}&per_page=${perPage}`,
          { headers }
        );

        if (!response.ok) {
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to fetch repositories');
        }

        const repos = await response.json() as Repository[];

        return res.status(200).json({
          repositories: repos.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
          })),
        });
      }

      case 'POST': {
        // Create a new repository for notes
        const { name, description = 'My notes repository', private: isPrivate = false } = req.body as {
          name: string;
          description?: string;
          private?: boolean;
        };

        if (!name) {
          return res.status(400).json({ error: 'Repository name required' });
        }

        const response = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            description,
            private: isPrivate,
            auto_init: true, // Initialize with README
            gitignore_template: 'Node',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to create repository');
        }

        const repoData = await response.json() as Repository;

        return res.status(201).json({
          success: true,
          repository: {
            id: repoData.id,
            name: repoData.name,
            fullName: repoData.full_name,
            description: repoData.description,
            private: repoData.private,
            url: repoData.html_url,
            defaultBranch: repoData.default_branch,
          },
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Repos API error:', error);
    return res.status(500).json({
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
