import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Bell, Shield, Sparkles, Cpu, Trash2 } from 'lucide-react';
import { AerixNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AerixNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (category: AerixNotification['category']) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'system':
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm h-full bg-[#090d16] border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white">System Feed</h3>
                <span className="text-[11px] text-slate-400">
                  {notifications.filter((n) => !n.read).length} unread updates
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-b border-slate-800/40 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 hover:text-rose-400 transition-colors py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Bell className="w-8 h-8 stroke-[1.5] mb-2 opacity-30" />
                <span>All caught up. No notifications.</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.read
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                      : 'bg-slate-800/60 border-cyan-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center text-[10px] text-slate-400 font-mono">
            AERIX Neural Bus · Sandbox Secure
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
