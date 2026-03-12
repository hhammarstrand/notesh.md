import type { VercelRequest, VercelResponse } from '@vercel/node';
import CryptoJS from 'crypto-js';

interface NoteMetadata {
  title: string;
  tags?: string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

interface Note {
  id: string;
  title: string;
  content: string;
  metadata: NoteMetadata;
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
 * Sanitize filename for safe file storage
 */
function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 100) // Limit length
    + '.md';
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { metadata: NoteMetadata; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: { title: 'Untitled' },
      body: content,
    };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // Simple YAML-like parsing
  const metadata: NoteMetadata = { title: 'Untitled' };
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value.replace(/'/g, '"'));
        } catch {
          // Keep as string if parsing fails
        }
      }
      
      metadata[key] = value;
    }
  });

  return { metadata, body };
}

/**
 * Generate frontmatter string
 */
function generateFrontmatter(metadata: NoteMetadata): string {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  
  lines.push('---', '');
  return lines.join('\n');
}

/**
 * Sync API Handler
 * GET: List notes from repo
 * POST: Save a note to repo
 * DELETE: Delete a note from repo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

  const { owner, repo, path: notesPath = 'notes' } = req.query as { 
    owner: string; 
    repo: string; 
    path?: string;
  };

  if (!owner || !repo) {
    return res.status(400).json({ error: 'Owner and repo required' });
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${notesPath}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'notesh.md',
    'Content-Type': 'application/json',
  };

  try {
    switch (req.method) {
      case 'GET': {
        // List all notes
        const response = await fetch(baseUrl, { headers });
        
        if (response.status === 404) {
          // Notes folder doesn't exist yet
          return res.status(200).json({ notes: [] });
        }

        if (!response.ok) {
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to fetch notes');
        }

        const files = await response.json() as Array<{ name: string; download_url: string; sha: string }>;
        const markdownFiles = files.filter(f => f.name.endsWith('.md'));

        // Fetch content of each note
        const notes: Note[] = await Promise.all(
          markdownFiles.map(async (file) => {
            const contentResponse = await fetch(file.download_url);
            const content = await contentResponse.text();
            const { metadata, body } = parseFrontmatter(content);
            
            return {
              id: file.sha,
              title: metadata.title || file.name.replace('.md', ''),
              content: body,
              metadata: {
                ...metadata,
                filename: file.name,
                sha: file.sha,
              },
            };
          })
        );

        return res.status(200).json({ notes });
      }

      case 'POST': {
        // Save a note
        const { title, content, tags = [], filename } = req.body as {
          title: string;
          content: string;
          tags?: string[];
          filename?: string;
        };

        if (!title || content === undefined) {
          return res.status(400).json({ error: 'Title and content required' });
        }

        const safeFilename = filename || sanitizeFilename(title);
        const filePath = `${notesPath}/${safeFilename}`;
        const now = new Date().toISOString();

        // Check if file exists
        const existingResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          { headers }
        );
        const existing = existingResponse.ok ? await existingResponse.json() as { sha: string } : null;

        // Generate frontmatter
        const metadata: NoteMetadata = {
          title,
          tags,
          created: existing ? undefined : now,
          updated: now,
        };

        const fullContent = generateFrontmatter(metadata) + content;
        const encodedContent = Buffer.from(fullContent).toString('base64');

        // Create or update file
        const saveResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: existing ? `Update note: ${title}` : `Create note: ${title}`,
              content: encodedContent,
              sha: existing?.sha,
            }),
          }
        );

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to save note');
        }

        const result = await saveResponse.json() as { content: { sha: string } };

        return res.status(200).json({
          success: true,
          note: {
            id: result.content.sha,
            title,
            content,
            metadata: {
              ...metadata,
              filename: safeFilename,
              sha: result.content.sha,
            },
          },
        });
      }

      case 'DELETE': {
        // Delete a note
        const { filename: deleteFilename, sha } = req.query as { filename: string; sha: string };

        if (!deleteFilename || !sha) {
          return res.status(400).json({ error: 'Filename and sha required' });
        }

        const filePath = `${notesPath}/${deleteFilename}`;

        const deleteResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: 'DELETE',
            headers,
            body: JSON.stringify({
              message: `Delete note: ${deleteFilename}`,
              sha,
            }),
          }
        );

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to delete note');
        }

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
