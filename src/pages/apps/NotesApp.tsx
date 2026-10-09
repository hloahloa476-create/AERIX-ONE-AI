import React, { useState, useEffect } from 'react';
import {
  PenSquare,
  Search,
  Pin,
  Trash2,
  Edit3,
  X,
  Plus,
  Folder,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { UserNote } from '../../types';
import { INITIAL_NOTES } from '../../data/mockData';
import { storageService } from '../../services/storageService';
import { soundEffects } from '../../utils/sound';

interface NotesAppProps {
  onClose: () => void;
}

export const NotesApp: React.FC<NotesAppProps> = ({ onClose }) => {
  const [notes, setNotes] = useState<UserNote[]>(() => {
    return storageService.getItem<UserNote[]>('user_notes', INITIAL_NOTES);
  });

  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for new/edit note
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formFolder, setFormFolder] = useState('Personal');
  const [formPinned, setFormPinned] = useState(false);

  // Sync to local storage
  useEffect(() => {
    storageService.setItem('user_notes', notes);
  }, [notes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleStartCreate = () => {
    soundEffects.playHapticClick();
    setFormTitle('');
    setFormContent('');
    setFormFolder(activeFolder === 'All' ? 'Personal' : activeFolder);
    setFormPinned(false);
    setIsCreating(true);
    setEditingNote(null);
  };

  const handleStartEdit = (note: UserNote) => {
    soundEffects.playHapticClick();
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormFolder(note.folder);
    setFormPinned(note.pinned);
    setIsCreating(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    soundEffects.playSuccessBeep();

    if (editingNote) {
      // Update
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: formTitle.trim(),
                content: formContent,
                folder: formFolder,
                pinned: formPinned,
                updatedAt: 'Just now',
              }
            : n
        )
      );
      setEditingNote(null);
      showToast('Note updated locally');
    } else {
      // Create
      const newNote: UserNote = {
        id: `note-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent,
        folder: formFolder,
        pinned: formPinned,
        updatedAt: 'Just now',
      };
      setNotes((prev) => [newNote, ...prev]);
      setIsCreating(false);
      showToast('New note saved to sandbox');
    }
  };

  const handleDeleteNote = (id: string) => {
    soundEffects.playHapticClick();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNote?.id === id) setEditingNote(null);
    showToast('Note deleted');
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundEffects.playHapticClick();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const folders = ['All', 'System', 'Projects', 'Personal'];

  const filteredNotes = notes
    .filter((n) => {
      const matchesFolder = activeFolder === 'All' || n.folder === activeFolder;
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="fixed inset-0 z-40 bg-[#040711] text-slate-100 flex flex-col overflow-hidden select-none pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="p-3 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <PenSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX NOTES
            </h2>
            <span className="text-[10px] font-mono text-amber-400">
              Offline Local Storage ({notes.length} entries)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStartCreate}
            className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Folder Nav Tabs */}
      <div className="p-3 border-b border-slate-800 space-y-2 aerix-glass shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes content..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {folders.map((f) => {
            const isActive = activeFolder === f;
            const count =
              f === 'All'
                ? notes.length
                : notes.filter((n) => n.folder === f).length;
            return (
              <button
                key={f}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setActiveFolder(f);
                }}
                className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'aerix-glass-card text-slate-400 hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{f}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid / List */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No notes found. Tap "New Note" to save thoughts offline.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleStartEdit(note)}
              className={`p-4 rounded-3xl aerix-glass-card border cursor-pointer transition-all hover:border-amber-400/50 group ${
                note.pinned ? 'border-amber-500/30 bg-amber-950/10' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {note.pinned && (
                    <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300">
                    {note.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleTogglePin(e, note.id)}
                    className="p-1 text-slate-400 hover:text-amber-400"
                    title={note.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50 text-[10px] font-mono text-slate-500">
                <span className="text-amber-400/90 font-medium">#{note.folder}</span>
                <span>{note.updatedAt}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Editor Drawer/Modal (Create or Edit) */}
      {(isCreating || editingNote) && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
          <form
            onSubmit={handleSaveNote}
            className="w-full max-w-md mx-auto bg-[#090d16] rounded-t-3xl border-t border-slate-800 p-4 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingNote(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400">TITLE</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400">FOLDER</label>
                <select
                  value={formFolder}
                  onChange={(e) => setFormFolder(e.target.value)}
                  className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Personal">Personal</option>
                  <option value="Projects">Projects</option>
                  <option value="System">System</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400">PIN STATUS</label>
                <button
                  type="button"
                  onClick={() => setFormPinned(!formPinned)}
                  className={`w-full mt-0.5 p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    formPinned
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{formPinned ? 'Pinned' : 'Not Pinned'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400">CONTENT</label>
              <textarea
                rows={6}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write your note markdown or thoughts..."
                className="w-full mt-0.5 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingNote(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-400/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
