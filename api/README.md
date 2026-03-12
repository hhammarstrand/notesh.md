# GitHub OAuth API Configuration

This folder contains Vercel serverless functions for GitHub OAuth integration and note synchronization.

## Environment Variables

Create a `.env.local` file with these variables:

```bash
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# Encryption secret (generate a random string)
ENCRYPTION_SECRET=your_random_encryption_secret_min_32_chars
```

## API Endpoints

### Auth Routes

#### GET /api/auth/github
Initiates GitHub OAuth flow. Returns authorization URL.

**Response:**
```json
{
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "csrf-protection-state"
}
```

#### GET /api/auth/callback
Handles OAuth callback, exchanges code for access token.

**Query Parameters:**
- `code` - Authorization code from GitHub
- `state` - CSRF protection state

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 123456,
    "login": "username",
    "name": "User Name",
    "email": "user@example.com",
    "avatarUrl": "https://avatars.githubusercontent.com/..."
  },
  "encryptedToken": "encrypted-access-token",
  "scope": "repo read:user"
}
```

### Repos Routes

#### GET /api/repos
Lists user's GitHub repositories.

**Headers:**
- `Authorization: Bearer <encrypted-token>`

**Response:**
```json
{
  "repositories": [
    {
      "id": 123,
      "name": "my-notes",
      "fullName": "username/my-notes",
      "description": "My notes repository",
      "private": false,
      "url": "https://github.com/username/my-notes",
      "defaultBranch": "main"
    }
  ]
}
```

#### POST /api/repos
Creates a new repository for notes.

**Headers:**
- `Authorization: Bearer <encrypted-token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "my-notes-repo",
  "description": "My notes repository",
  "private": true
}
```

### Sync Routes

#### GET /api/sync
Lists all notes from the repository.

**Query Parameters:**
- `owner` - Repository owner
- `repo` - Repository name
- `path` - Notes folder path (default: 'notes')

**Headers:**
- `Authorization: Bearer <encrypted-token>`

**Response:**
```json
{
  "notes": [
    {
      "id": "abc123",
      "title": "My Note",
      "content": "Note content...",
      "metadata": {
        "title": "My Note",
        "tags": ["idea", "work"],
        "created": "2024-01-01T00:00:00Z",
        "updated": "2024-01-02T00:00:00Z",
        "filename": "my-note.md",
        "sha": "abc123"
      }
    }
  ]
}
```

#### POST /api/sync
Saves a note to the repository.

**Query Parameters:**
- `owner` - Repository owner
- `repo` - Repository name
- `path` - Notes folder path (default: 'notes')

**Headers:**
- `Authorization: Bearer <encrypted-token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "title": "My Note",
  "content": "Note content in markdown...",
  "tags": ["idea", "work"],
  "filename": "my-note.md"
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "abc123",
    "title": "My Note",
    "content": "Note content...",
    "metadata": {
      "title": "My Note",
      "tags": ["idea", "work"],
      "updated": "2024-01-02T00:00:00Z",
      "filename": "my-note.md",
      "sha": "abc123"
    }
  }
}
```

#### DELETE /api/sync
Deletes a note from the repository.

**Query Parameters:**
- `owner` - Repository owner
- `repo` - Repository name
- `path` - Notes folder path (default: 'notes')
- `filename` - Note filename
- `sha` - File SHA (required for deletion)

**Headers:**
- `Authorization: Bearer <encrypted-token>`

**Response:**
```json
{
  "success": true
}
```

## Note File Format

Notes are stored as markdown files with YAML frontmatter:

```markdown
---
title: "My Note"
tags: ["idea", "work"]
created: "2024-01-01T00:00:00Z"
updated: "2024-01-02T00:00:00Z"
---

Note content in markdown...
```

## Local Development

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Run locally:
```bash
vercel dev
```

3. Set environment variables in Vercel:
```bash
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add ENCRYPTION_SECRET
```

## GitHub OAuth App Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `notesh.md`
   - Homepage URL: Your app URL (e.g., `https://notesh-md.vercel.app`)
   - Authorization callback URL: `https://notesh-md.vercel.app/api/auth/callback`
4. Save and copy the Client ID and Client Secret
