import type { Plugin, PluginResult } from '../types';

export const wordCountPlugin: Plugin = {
  id: 'word-count',
  name: 'Word Count',
  description: 'Counts words, characters, and lines in the note',
  enabled: true,
  execute: (content: string): PluginResult => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    const lines = content.split('\n').length;
    const paragraphs = content.split(/\n\s*\n/).filter(Boolean).length;
    
    return {
      stats: {
        words,
        characters,
        charactersNoSpaces,
        lines,
        paragraphs
      }
    };
  }
};

export const readingTimePlugin: Plugin = {
  id: 'reading-time',
  name: 'Reading Time',
  description: 'Estimates reading time based on word count',
  enabled: true,
  execute: (content: string): PluginResult => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.ceil(words / 200);
    
    return {
      stats: {
        words,
        readingTimeMinutes
      }
    };
  }
};

export const headingCountPlugin: Plugin = {
  id: 'heading-count',
  name: 'Heading Count',
  description: 'Counts headings in the note',
  enabled: true,
  execute: (content: string): PluginResult => {
    const h1 = (content.match(/^# .+$/gm) || []).length;
    const h2 = (content.match(/^## .+$/gm) || []).length;
    const h3 = (content.match(/^### .+$/gm) || []).length;
    const h4 = (content.match(/^#### .+$/gm) || []).length;
    const total = h1 + h2 + h3 + h4;
    
    return {
      stats: {
        h1, h2, h3, h4, total
      }
    };
  }
};

export const linkCountPlugin: Plugin = {
  id: 'link-count',
  name: 'Link Count',
  description: 'Counts wiki links and external links',
  enabled: true,
  execute: (content: string): PluginResult => {
    const wikiLinks = (content.match(/\[\[([^\]]+)\]\]/g) || []).length;
    const mdLinks = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const urls = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    
    return {
      stats: {
        wikiLinks,
        mdLinks,
        urls,
        totalLinks: wikiLinks + mdLinks + urls
      }
    };
  }
};

export const allPlugins: Plugin[] = [
  wordCountPlugin,
  readingTimePlugin,
  headingCountPlugin,
  linkCountPlugin
];

export function executePlugin(pluginId: string, content: string): PluginResult | null {
  const plugin = allPlugins.find((p) => p.id === pluginId && p.enabled);
  if (!plugin) return null;
  return plugin.execute(content);
}

export function executeAllPlugins(content: string): Record<string, PluginResult> {
  const results: Record<string, PluginResult> = {};
  for (const plugin of allPlugins) {
    if (plugin.enabled) {
      results[plugin.id] = plugin.execute(content);
    }
  }
  return results;
}
