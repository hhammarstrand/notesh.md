import { useCallback, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useNoteStore } from '../stores/noteStore';
import { debounce, generateId } from '../lib/utils';
import { templates, applyTemplate, getTemplateById } from '../templates';
import { executeAllPlugins } from '../plugins';
import { marked } from 'marked';
import { TagInput } from './TagInput';
import './Editor.css';

export function NoteEditor() {
  const { notes, activeNoteId, updateNote, addNote, setActiveNote, deleteNote } = useNoteStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  
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

  const handleTagAdd = useCallback((tag: string) => {
    if (activeNoteId && activeNote && tag.trim() && !activeNote.tags.includes(tag.trim())) {
      setIsSaving(true);
      updateNote(activeNoteId, {
        tags: [...activeNote.tags, tag.trim()],
        updatedAt: new Date().toISOString()
      });
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }
  }, [activeNoteId, activeNote, updateNote]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    if (activeNoteId && activeNote) {
      setIsSaving(true);
      updateNote(activeNoteId, {
        tags: activeNote.tags.filter(tag => tag !== tagToRemove),
        updatedAt: new Date().toISOString()
      });
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }
  }, [activeNoteId, activeNote, updateNote]);
  
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

  const handleDelete = useCallback(() => {
    if (activeNoteId) {
      deleteNote(activeNoteId);
      setShowDeleteConfirm(false);
    }
  }, [activeNoteId, deleteNote]);
  
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
        <button 
          className="btn-danger" 
          onClick={() => setShowDeleteConfirm(true)}
          data-testid="delete-btn"
          title="Delete note"
        >
          🗑️
        </button>
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm" style={{ 
          padding: '1rem', 
          background: '#ff6b6b22', 
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p>Delete "{activeNote.title}"?</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-danger" onClick={handleDelete} data-testid="confirm-delete">
              Delete
            </button>
            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="template-selector" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select 
          value={selectedTemplate} 
          onChange={handleTemplateChange}
          data-testid="template-selector"
          style={{ flex: 1 }}
        >
          <option value="">Select a template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id} data-testid={`template-${t.id}`}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="view-toggle" style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            className={viewMode === 'edit' ? 'btn-active' : 'btn-secondary'}
            onClick={() => setViewMode('edit')}
            title="Edit"
          >
            ✏️
          </button>
          <button 
            className={viewMode === 'preview' ? 'btn-active' : 'btn-secondary'}
            onClick={() => setViewMode('preview')}
            title="Preview"
            data-testid="preview-btn"
          >
            👁️
          </button>
          <button 
            className={viewMode === 'split' ? 'btn-active' : 'btn-secondary'}
            onClick={() => setViewMode('split')}
            title="Split"
          >
            ↔️
          </button>
        </div>
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
      <div style={{ marginBottom: '1rem' }}>
        <TagInput 
          tags={activeNote.tags} 
          onAdd={handleTagAdd} 
          onRemove={handleTagRemove} 
        />
      </div>
      {(viewMode === 'edit' || viewMode === 'split') && (
        <Editor
          height={viewMode === 'split' ? 'calc(50vh - 150px)' : 'calc(100vh - 280px)'}
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
      )}
      {(viewMode === 'preview' || viewMode === 'split') && (
        <div 
          className="markdown-preview"
          data-testid="markdown-preview"
          style={{
            height: viewMode === 'split' ? 'calc(50vh - 150px)' : 'calc(100vh - 280px)',
            overflow: 'auto',
            padding: '1rem',
            background: '#1e1e1e',
            border: viewMode === 'split' ? '1px solid #333' : 'none',
            borderRadius: '4px'
          }}
          dangerouslySetInnerHTML={{ __html: marked(activeNote.content || '') }}
        />
      )}
    </div>
  );
}