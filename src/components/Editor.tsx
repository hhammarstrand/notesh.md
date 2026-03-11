import { useCallback, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useNoteStore } from '../stores/noteStore';
import { debounce, generateId } from '../lib/utils';
import { templates, applyTemplate, getTemplateById } from '../templates';
import { executeAllPlugins } from '../plugins';

export function NoteEditor() {
  const { notes, activeNoteId, updateNote, addNote, setActiveNote } = useNoteStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );
  
  const debouncedUpdate = useMemo(
    () => debounce((content: string) => {
      if (activeNoteId) {
        setIsSaving(true);
        updateNote(activeNoteId, {
          content,
          updatedAt: new Date().toISOString()
        });
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    }, 300),
    [activeNoteId, updateNote]
  );
  
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      debouncedUpdate(value || '');
    },
    [debouncedUpdate]
  );
  
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (activeNoteId) {
        setIsSaving(true);
        updateNote(activeNoteId, {
          title: e.target.value,
          updatedAt: new Date().toISOString()
        });
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }
    },
    [activeNoteId, updateNote]
  );
  
  const handleTemplateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId && activeNoteId) {
      const template = getTemplateById(templateId);
      if (template) {
        const content = applyTemplate(template);
        updateNote(activeNoteId, { content });
      }
    }
  }, [activeNoteId, updateNote]);
  
  const handleCreateNote = useCallback(() => {
    const newNote = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      linkedNotes: []
    };
    addNote(newNote);
    setActiveNote(newNote.id);
  }, [addNote, setActiveNote]);
  
  const pluginStats = useMemo(() => {
    if (!activeNote) return null;
    return executeAllPlugins(activeNote.content);
  }, [activeNote]);
  
  if (!activeNote) {
    return (
      <div className="editor-placeholder">
        <h2>Welcome to notesh.md</h2>
        <p>Select a note from the sidebar or create a new one</p>
        <div className="template-selector">
          <select 
            value={selectedTemplate} 
            onChange={handleTemplateChange}
            data-testid="template-selector"
          >
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id} data-testid={`template-${t.id}`}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={handleCreateNote} data-testid="new-note-btn">
          Create New Note
        </button>
      </div>
    );
  }
  
  return (
    <div className="editor-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={activeNote.title}
          onChange={handleTitleChange}
          className="editor-title"
          placeholder="Note title..."
          style={{ flex: 1, marginBottom: 0 }}
        />
        <div className="save-indicator" data-testid="save-indicator">
          {isSaving ? 'Saving...' : lastSaved ? 'Saved' : ''}
        </div>
      </div>
      <div className="template-selector" style={{ marginBottom: '1rem' }}>
        <select 
          value={selectedTemplate} 
          onChange={handleTemplateChange}
          data-testid="template-selector"
        >
          <option value="">Select a template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id} data-testid={`template-${t.id}`}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {pluginStats && (
        <div className="plugin-stats" style={{ marginBottom: '1rem' }}>
          {pluginStats['word-count'] && (
            <span>Words: {pluginStats['word-count'].stats.words}</span>
          )}
          {pluginStats['reading-time'] && (
            <span>Reading: {pluginStats['reading-time'].stats.readingTimeMinutes} min</span>
          )}
          {pluginStats['link-count'] && (
            <span>Links: {pluginStats['link-count'].stats.totalLinks}</span>
          )}
        </div>
      )}
      <Editor
        height="calc(100vh - 220px)"
        defaultLanguage="markdown"
        value={activeNote.content}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          fontSize: 14,
          lineNumbers: 'off',
          padding: { top: 16 }
        }}
      />
    </div>
  );
}