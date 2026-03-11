import type { Note, NoteLink, GraphNode, GraphEdge, Backlink } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function extractLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  return links;
}

export function extractBacklinks(content: string, currentTitle: string): Backlink[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const backlinks: Backlink[] = [];
  let match;
  const lines = content.split('\n');
  
  while ((match = linkRegex.exec(content)) !== null) {
    const linkedTitle = match[1];
    if (linkedTitle.toLowerCase() !== currentTitle.toLowerCase()) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const context = lines[lineNum - 1] || '';
      backlinks.push({
        sourceNoteId: '',
        sourceNoteTitle: linkedTitle,
        context: context.trim()
      });
    }
  }
  
  return backlinks;
}

export function getBacklinksForNote(targetNote: Note, allNotes: Note[]): Backlink[] {
  const backlinks: Backlink[] = [];
  
  for (const note of allNotes) {
    if (note.id === targetNote.id) continue;
    
    const links = extractLinks(note.content);
    const hasLink = links.some(
      (link) => link.toLowerCase() === targetNote.title.toLowerCase()
    );
    
    if (hasLink) {
      const contextMatch = note.content.match(new RegExp(`\\[\\[${targetNote.title}\\]\\]`, 'i'));
      let context = '';
      if (contextMatch) {
        const idx = contextMatch.index || 0;
        const lines = note.content.substring(0, idx).split('\n');
        context = lines[lines.length - 1]?.trim() || '';
      }
      
      backlinks.push({
        sourceNoteId: note.id,
        sourceNoteTitle: note.title,
        context
      });
    }
  }
  
  return backlinks;
}

export function parseNoteLinks(notes: Note[]): NoteLink[] {
  const links: NoteLink[] = [];
  
  for (const note of notes) {
    const linkedNotes = extractLinks(note.content);
    
    for (const linked of linkedNotes) {
      const targetNote = notes.find(
        (n) => n.title.toLowerCase() === linked.toLowerCase()
      );
      
      if (targetNote) {
        links.push({ source: note.id, target: targetNote.id });
      }
    }
  }
  
  return links;
}

export function buildGraphData(notes: Note[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = notes.map((n) => ({ id: n.id, label: n.title }));
  const edges: GraphEdge[] = parseNoteLinks(notes);
  
  return { nodes, edges };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}