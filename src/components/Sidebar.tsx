import { useNoteStore } from '../stores/noteStore';
import { generateId } from '../lib/utils';
import type { Note } from '../types';

export function Sidebar() {
  const { notes, activeNoteId, searchQuery, setActiveNote, setSearchQuery, addNote, backlinks, setActiveNote: setActive } = useNoteStore();
  
  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreateNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      linkedNotes: []
    };
    
    addNote(newNote);
    setActiveNote(newNote.id);
  };
  
  const handleBacklinkClick = (noteId: string) => {
    setActive(noteId);
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">notesh.md</h1>
        <button className="new-note-btn" onClick={handleCreateNote} data-testid="new-note-btn">
          + New Note
        </button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          data-testid="search-input"
        />
      </div>
      
      <div className="notes-list">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
            onClick={() => setActiveNote(note.id)}
          >
            <h3 className="note-title">{note.title}</h3>
            <p className="note-preview">
              {note.content.slice(0, 50) || 'No content'}
            </p>
            {note.tags.length > 0 && (
              <div className="note-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="note-tag">#{tag}</span>
                ))}
              </div>
            )}
            <span className="note-date">
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
        
        {filteredNotes.length === 0 && (
          <div className="empty-state" data-testid="no-results">
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </div>
        )}
      </div>
      
      {backlinks.length > 0 && (
        <div className="backlinks-panel">
          <h4>Backlinks ({backlinks.length})</h4>
          {backlinks.map((backlink, idx) => (
            <div
              key={idx}
              className="backlink-item"
              onClick={() => handleBacklinkClick(backlink.sourceNoteId)}
            >
              <strong>{backlink.sourceNoteTitle}</strong>
              {backlink.context && <p style={{ margin: '0.25rem 0', fontSize: '0.75rem' }}>{backlink.context}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}