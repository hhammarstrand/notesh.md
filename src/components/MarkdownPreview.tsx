import { useMemo } from 'react';
import { marked } from 'marked';
import { useNoteStore } from '../stores/noteStore';

export function MarkdownPreview() {
  const { notes, activeNoteId } = useNoteStore();
  
  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );
  
  const htmlContent = useMemo(() => {
    if (!activeNote) return '';
    return marked(activeNote.content);
  }, [activeNote]);
  
  if (!activeNote) {
    return (
      <div className="preview-placeholder">
        <h2>Preview</h2>
        <p>Select a note to preview</p>
      </div>
    );
  }
  
  return (
    <div className="preview-container">
      <h1 className="preview-title">{activeNote.title}</h1>
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}