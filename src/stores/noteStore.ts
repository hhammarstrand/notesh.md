import { create } from 'zustand';
import type { Note, Backlink, Theme } from '../types';
import { getBacklinksForNote } from '../lib/utils';

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  backlinks: Backlink[];
  theme: Theme;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  updateBacklinks: () => void;
  setTheme: (theme: Theme) => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNoteId: null,
  searchQuery: '',
  backlinks: [],
  theme: 'dark',
  setNotes: (notes) => {
    set({ notes });
    get().updateBacklinks();
  },
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, updates) => set((state) => {
    const newNotes = state.notes.map((n) => n.id === id ? { ...n, ...updates } : n);
    return { notes: newNotes };
  }),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
    activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
  })),
  setActiveNote: (id) => {
    set({ activeNoteId: id });
    get().updateBacklinks();
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  updateBacklinks: () => {
    const { notes, activeNoteId } = get();
    const activeNote = notes.find((n) => n.id === activeNoteId);
    if (activeNote) {
      const backlinks = getBacklinksForNote(activeNote, notes);
      set({ backlinks });
    } else {
      set({ backlinks: [] });
    }
  },
  setTheme: (theme) => set({ theme })
}));