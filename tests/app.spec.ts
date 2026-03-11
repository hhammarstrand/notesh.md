import { test, expect } from '@playwright/test';

test.describe('Notesh.md E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Create Note', () => {
    test('should create a new note', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      
      await expect(page.locator('.editor-title')).toBeVisible();
      await page.fill('.editor-title', 'Test Note');
      
      await page.waitForTimeout(500);
      
      const notes = await page.locator('.note-item').count();
      expect(notes).toBeGreaterThan(0);
    });

    test('should create note with template', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.click('[data-testid="template-selector"]');
      await page.click('[data-testid="template-daily"]');
      
      await expect(page.locator('.editor-title')).toBeVisible();
      const content = await page.locator('.monaco-editor textarea').inputValue();
      expect(content).toContain('#');
    });

    test('should validate empty title', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', '');
      
      await page.click('[data-testid="save-btn"]');
      
      await expect(page.locator('.error-message')).toBeVisible();
    });
  });

  test.describe('Edit Note', () => {
    test('should edit note title', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Original Title');
      await page.waitForTimeout(300);
      
      await page.fill('.editor-title', 'Updated Title');
      await page.waitForTimeout(300);
      
      const titleInput = await page.inputValue('.editor-title');
      expect(titleInput).toBe('Updated Title');
    });

    test('should edit note content', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Content Test');
      
      const editor = page.locator('.monaco-editor textarea');
      await editor.fill('# Hello World\n\nThis is a test note.');
      await page.waitForTimeout(500);
      
      await page.click('[data-testid="preview-btn"]');
      await expect(page.locator('.markdown-preview')).toContainText('Hello World');
    });

    test('should auto-save with debounce', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Auto-save Test');
      
      const editor = page.locator('.monaco-editor textarea');
      await editor.fill('Content for auto-save');
      
      await page.waitForTimeout(500);
      
      const saveIndicator = page.locator('[data-testid="save-indicator"]');
      await expect(saveIndicator).toContainText('Saved');
    });

    test('should add wiki links', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Link Test');
      
      const editor = page.locator('.monaco-editor textarea');
      await editor.fill('Check out [[Another Note]] for more info.');
      await page.waitForTimeout(500);
      
      await page.click('[data-testid="preview-btn"]');
      await expect(page.locator('.markdown-preview')).toContainText('Another Note');
    });

    test('should delete a note', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'To Delete');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="delete-btn"]');
      await page.click('[data-testid="confirm-delete"]');
      
      await expect(page.locator('.note-item:has-text("To Delete")')).not.toBeVisible();
    });
  });

  test.describe('View Graph', () => {
    test('should navigate to graph page', async ({ page }) => {
      await page.click('a[href="/graph"]');
      
      await expect(page).toHaveURL('/graph');
      await expect(page.locator('#graph-container')).toBeVisible();
    });

    test('should display graph nodes', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Note 1');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Note 2');
      await page.waitForTimeout(300);
      
      await page.click('a[href="/graph"]');
      await page.waitForTimeout(1000);
      
      const nodes = await page.locator('.graph-node').count();
      expect(nodes).toBeGreaterThanOrEqual(2);
    });

    test('should click node to navigate', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Graph Test Note');
      await page.waitForTimeout(300);
      
      await page.click('a[href="/graph"]');
      await page.waitForTimeout(1000);
      
      await page.click('.graph-node:first-child');
      await expect(page.locator('.editor-title')).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('should search notes', async ({ page }) => {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Searchable Note');
      await page.waitForTimeout(300);
      
      await page.fill('[data-testid="search-input"]', 'Searchable');
      await page.waitForTimeout(500);
      
      const results = await page.locator('.note-item').count();
      expect(results).toBe(1);
    });

    test('should show no results message', async ({ page }) => {
      await page.fill('[data-testid="search-input"]', 'NonexistentNote12345');
      await page.waitForTimeout(500);
      
      await expect(page.locator('.no-results')).toBeVisible();
    });
  });

  test.describe('GitHub Sync', () => {
    test('should show settings page', async ({ page }) => {
      await page.click('a[href="/settings"]');
      
      await expect(page).toHaveURL('/settings');
      await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    });

    test('should show GitHub sync section', async ({ page }) => {
      await page.click('a[href="/settings"]');
      
      await expect(page.locator('h3:has-text("GitHub Sync")')).toBeVisible();
      await expect(page.locator('input[placeholder="ghp_..."]')).toBeVisible();
    });

    test('should validate token input', async ({ page }) => {
      await page.click('a[href="/settings"]');
      await page.fill('input[placeholder="ghp_..."]', 'short');
      await page.fill('input[placeholder="username"]', 'user');
      await page.fill('input[placeholder="my-notes"]', 'repo');
      await page.click('button:has-text("Connect")');
      
      await expect(page.locator('.error-message')).toBeVisible();
    });

    test('should show sync button when connected', async ({ page }) => {
      await page.click('a[href="/settings"]');
      await page.fill('input[placeholder="ghp_..."]', 'ghp_testtoken123456789');
      await page.fill('input[placeholder="username"]', 'testuser');
      await page.fill('input[placeholder="my-notes"]', 'test-repo');
      
      await page.click('button:has-text("Connect")');
      
      await expect(page.locator('button:has-text("Sync Notes")')).toBeVisible();
      await expect(page.locator('button:has-text("Disconnect")')).toBeVisible();
    });
  });

  test.describe('Theme', () => {
    test('should toggle dark/light mode', async ({ page }) => {
      await page.click('[data-testid="theme-toggle"]');
      
      const html = await page.locator('html').getAttribute('class');
      expect(html).toContain('light');
    });

    test('should persist theme preference', async ({ page }) => {
      await page.click('[data-testid="theme-toggle"]');
      await page.reload();
      
      const html = await page.locator('html').getAttribute('class');
      expect(html).toContain('light');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('.top-nav')).toBeVisible();
      await page.click('[data-testid="mobile-menu-btn"]');
      await expect(page.locator('.sidebar')).toBeVisible();
    });

    test('should hide sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('.sidebar')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for failed save', async ({ page }) => {
      await page.route('**/api/notes', (route) => {
        route.abort('failed');
      });
      
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('.editor-title', 'Error Test');
      
      await page.waitForTimeout(1000);
      
      await expect(page.locator('.toast-error')).toBeVisible();
    });

    test('should retry on network failure', async ({ page }) => {
      let attempts = 0;
      await page.route('**/api/notes', (route) => {
        attempts++;
        if (attempts < 2) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.click('[data-testid="new-note-btn"]');
      await page.waitForTimeout(1500);
      
      await expect(page.locator('.toast-error')).not.toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading on initial load', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });

    test('should show syncing indicator', async ({ page }) => {
      await page.click('a[href="/settings"]');
      await page.fill('input[placeholder="ghp_..."]', 'ghp_testtoken123456789');
      await page.fill('input[placeholder="username"]', 'testuser');
      await page.fill('input[placeholder="my-notes"]', 'test-repo');
      await page.click('button:has-text("Connect")');
      
      await page.click('button:has-text("Sync Notes")');
      
      await expect(page.locator('button:has-text("Syncing...")')).toBeVisible();
    });
  });
});
