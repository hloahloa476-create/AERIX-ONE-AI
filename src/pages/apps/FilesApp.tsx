import React, { useState, useRef } from 'react';
import {
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Download,
  Search,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { UserFile } from '../../types';
import { INITIAL_FILES } from '../../data/mockData';
import { soundEffects } from '../../utils/sound';

interface FilesAppProps {
  onClose: () => void;
}

export const FilesApp: React.FC<FilesAppProps> = ({ onClose }) => {
  const [category, setCategory] = useState<'all' | 'image' | 'video' | 'document' | 'audio' | 'download'>('all');
  const [files, setFiles] = useState<UserFile[]>(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File action menus
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<UserFile | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    soundEffects.playSuccessBeep();
    let cat: UserFile['category'] = 'document';
    if (uploaded.type.startsWith('image/')) cat = 'image';
    else if (uploaded.type.startsWith('video/')) cat = 'video';
    else if (uploaded.type.startsWith('audio/')) cat = 'audio';

    const newFile: UserFile = {
      id: `f-${Date.now()}`,
      name: uploaded.name,
      category: cat,
      size: `${(uploaded.size / (1024 * 1024)).toFixed(1)} MB`,
      updatedAt: 'Just now',
    };

    setFiles((prev) => [newFile, ...prev]);
    showToast(`Stored ${uploaded.name} in sandbox`);
  };

  const handleDelete = (id: string) => {
    soundEffects.playHapticClick();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setActiveMenuFileId(null);
    showToast('File removed from local storage');
  };

  const handleStartRename = (file: UserFile) => {
    soundEffects.playHapticClick();
    setRenamingFile(file);
    setRenameValue(file.name);
    setActiveMenuFileId(null);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !renameValue.trim()) return;

    soundEffects.playSuccessBeep();
    setFiles((prev) =>
      prev.map((f) =>
        f.id === renamingFile.id ? { ...f, name: renameValue.trim(), updatedAt: 'Just now' } : f
      )
    );
    setRenamingFile(null);
    showToast('File renamed');
  };

  const getCategoryIcon = (cat: UserFile['category']) => {
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-400" />;
      case 'download':
        return <Download className="w-4 h-4 text-blue-400" />;
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesCat = category === 'all' || f.category === category;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX FILES
            </h2>
            <span className="text-[10px] font-mono text-cyan-400">
              Sandboxed Vault ({files.length} items)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              fileInputRef.current?.click();
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="p-3 border-b border-slate-800 space-y-2 aerix-glass shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault files..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'document', label: 'Documents' },
            { id: 'audio', label: 'Audio' },
            { id: 'download', label: 'Downloads' },
          ].map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setCategory(cat.id as typeof category);
                }}
                className={`min-h-[36px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'aerix-glass-card text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Files List */}
      <div className="flex-1 overflow-y-auto p-3 max-w-md mx-auto w-full space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No files found in category. Tap Upload to add local assets.
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-2xl aerix-glass-card border border-slate-800/80 hover:border-cyan-500/40 flex items-center justify-between group relative"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {getCategoryIcon(file.category)}
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-xs text-white truncate group-hover:text-cyan-300">
                    {file.name}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{file.size}</span>
                    <span>·</span>
                    <span>{file.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Action Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenuFileId(
                      activeMenuFileId === file.id ? null : file.id
                    )
                  }
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {activeMenuFileId === file.id && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-[#090d16] border border-slate-700 rounded-xl p-1 shadow-2xl space-y-0.5">
                    <button
                      onClick={() => handleStartRename(file)}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="w-full px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-950/60 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Storage Footer */}
      <div className="p-3 aerix-glass border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 max-w-md mx-auto w-full">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>74.1 MB in Sandbox</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Tier 2 Local Storage</span>
      </div>

      {/* Rename Modal */}
      {renamingFile && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRename}
            className="w-full max-w-sm aerix-glass-elevated rounded-3xl p-5 border border-cyan-500/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Rename File</h3>
              <button
                type="button"
                onClick={() => setRenamingFile(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingFile(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
