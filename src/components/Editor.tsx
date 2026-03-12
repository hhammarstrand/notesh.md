import { useCallback, useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useNoteStore } from '../stores/noteStore';
import { debounce, generateId } from '../lib/utils';
import { templates, applyTemplate, getTemplateById } from '../templates';
import { TagInput } from './TagInput';
import './Editor.css';

export function NoteEditor() {
  const { notes, activeNoteId, updateNote, addNote, setActiveNote, deleteNote } = useNoteStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
    <div className="editor-container" data-color-mode="dark">
      <div className="editor-header">
        <input
          type="text"
          value={activeNote.title}
          onChange={handleTitleChange}
          className="editor-title"
          placeholder="Note title..."
        />
        <div className="editor-actions">
          <span className="save-indicator" data-testid="save-indicator">
            {isSaving ? 'Saving...' : lastSaved ? 'Saved' : ''}
          </span>
          <button 
            className="btn-icon delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="delete-btn"
            title="Delete note"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="editor-toolbar">
        <select 
          value={selectedTemplate} 
          onChange={handleTemplateChange}
          data-testid="template-selector"
          className="template-select"
        >
          <option value="">Template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <TagInput 
          tags={activeNote.tags} 
          onAdd={handleTagAdd} 
          onRemove={handleTagRemove} 
        />
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirm">
          <p>Delete "{activeNote.title}"?</p>
          <div className="delete-confirm-buttons">
            <button className="btn-danger" onClick={handleDelete} data-testid="confirm-delete">
              Delete
            </button>
            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="editor-content" data-color-mode="dark">
        <MDEditor
          value={activeNote.content}
          onChange={handleEditorChange}
          preview="live"
          height="calc(100vh - 280px)"
          data-color-mode="dark"
        />
      </div>
    </div>
  );
}
