import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Search,
  PenSquare,
  X,
  Star,
  ChevronLeft,
  Mail as MailIcon,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { MailMessage } from '../../types';
import { INITIAL_EMAILS } from '../../data/mockData';
import { soundEffects } from '../../utils/sound';
import { emailService } from '../../services/emailService';

interface MailAppProps {
  onClose: () => void;
}

export const MailApp: React.FC<MailAppProps> = ({ onClose }) => {
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [emails, setEmails] = useState<MailMessage[]>(INITIAL_EMAILS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<MailMessage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(emailService.isConnected());
  const [connectedEmail, setConnectedEmail] = useState<string | null>(emailService.getConnectedEmail());

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation dialogs (Mandatory for destructive/sending operations)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Load emails when folder changes or Gmail connects
  const loadEmails = async () => {
    if (!isGmailConnected) {
      setEmails(INITIAL_EMAILS);
      return;
    }

    setIsLoadingGmail(true);
    try {
      const gmailFolder = folder === 'drafts' ? 'inbox' : folder;
      const msgs = await emailService.listMessages(gmailFolder);
      if (msgs.length > 0) {
        setEmails(msgs);
      } else {
        setEmails([]);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
      showToast(err.message || 'Could not load Gmail inbox.');
    } finally {
      setIsLoadingGmail(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [folder, isGmailConnected]);

  const handleConnectGmail = async () => {
    soundEffects.playHapticClick();
    setIsConnectingGmail(true);
    try {
      await emailService.connectGmail();
      setIsGmailConnected(true);
      setConnectedEmail(emailService.getConnectedEmail());
      showToast('Connected to Google Workspace Gmail');
      soundEffects.playSuccessBeep();
      loadEmails();
    } catch (err: any) {
      console.error('Gmail connection error:', err);
      showToast(err.message || 'Failed to connect Gmail.');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = () => {
    soundEffects.playHapticClick();
    emailService.disconnectGmail();
    setIsGmailConnected(false);
    setConnectedEmail(null);
    setEmails(INITIAL_EMAILS);
    showToast('Disconnected from Gmail');
  };

  const handleSelectEmail = (mail: MailMessage) => {
    soundEffects.playHapticClick();
    setSelectedEmail(mail);
    setEmails((prev) =>
      prev.map((e) => (e.id === mail.id ? { ...e, unread: false } : e))
    );
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundEffects.playHapticClick();
    setEmails((prev) =>
      prev.map((mail) =>
        mail.id === id ? { ...mail, starred: !mail.starred } : mail
      )
    );
  };

  // Confirmation before deleting
  const handleRequestDelete = (id: string) => {
    soundEffects.playHapticClick();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    soundEffects.playHapticClick();
    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);

    if (isGmailConnected) {
      try {
        await emailService.trashMessage(idToDelete);
        showToast('Message moved to Gmail Trash');
      } catch (err) {
        console.warn('Could not trash in Gmail:', err);
      }
    }

    setEmails((prev) =>
      prev.map((mail) => {
        if (mail.id === idToDelete) {
          return { ...mail, folder: 'trash' };
        }
        return mail;
      })
    );
    setSelectedEmail(null);
    showToast('Dispatched to Trash');
  };

  // Confirmation before sending
  const handleRequestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;
    soundEffects.playHapticClick();
    setConfirmSendOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmSendOpen(false);
    soundEffects.playSuccessBeep();

    if (isGmailConnected) {
      try {
        await emailService.sendEmail({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody
        });
        showToast('Email delivered successfully via Gmail');
      } catch (err: any) {
        console.error('Failed to send via Gmail:', err);
        showToast(err.message || 'Failed to send via Gmail API.');
        return;
      }
    } else {
      showToast('Message sent to dispatch queue (Sandbox)');
    }

    const newMail: MailMessage = {
      id: `sent-${Date.now()}`,
      sender: connectedEmail || 'Commander Nova',
      email: composeTo.trim(),
      subject: composeSubject.trim(),
      snippet: composeBody.slice(0, 50) + '...',
      body: composeBody,
      date: 'Just now',
      unread: false,
      starred: false,
      folder: 'sent'
    };

    setEmails((prev) => [newMail, ...prev]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const filteredEmails = emails.filter((mail) => {
    const matchesFolder = mail.folder === folder;
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/95 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2">
          <MailIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Dialog for Sending Email (Mandatory workspace-integration rule) */}
      {confirmSendOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="aerix-glass-elevated rounded-3xl border border-cyan-500/40 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400">
              <Send className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white font-display">Confirm Outbound Dispatch</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to send this email to <span className="font-mono text-cyan-300">{composeTo}</span> with subject <span className="font-semibold text-white">"{composeSubject}"</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmSendOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Email (Mandatory workspace-integration rule) */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="aerix-glass-elevated rounded-3xl border border-red-500/40 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white font-display">Confirm Trash Dispatch</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Move this email to the Trash folder? You can restore it later from Trash.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedEmail) setSelectedEmail(null);
              else if (isComposing) setIsComposing(false);
              else onClose();
            }}
            className="p-2 rounded-xl aerix-glass-elevated hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base text-white">AERIX Mail</h2>
              {isGmailConnected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                  Gmail Live
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  Local Sandbox
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              {connectedEmail || 'Secure Quantum Encrypted Comms'}
            </p>
          </div>
        </div>

        {/* Gmail Connect / Disconnect Action */}
        <div className="flex items-center gap-2">
          {isGmailConnected ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={loadEmails}
                disabled={isLoadingGmail}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white"
                title="Refresh Gmail"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingGmail ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDisconnectGmail}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400"
                title="Disconnect Gmail"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              {isConnectingGmail ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MailIcon className="w-3.5 h-3.5" />
              )}
              <span>Connect Gmail</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setIsComposing(true);
            }}
            className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 active:scale-95"
            title="Compose Email"
          >
            <PenSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Mail Viewport */}
      {selectedEmail ? (
        /* Reading Email View */
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={() => setSelectedEmail(null)}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-mono"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return to {folder}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleToggleStar(e, selectedEmail.id)}
                className={`p-2 rounded-xl aerix-glass-elevated ${
                  selectedEmail.starred ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => handleRequestDelete(selectedEmail.id)}
                className="p-2 rounded-xl aerix-glass-elevated hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-white">
              {selectedEmail.subject}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-3">
              <div>
                <span className="font-semibold text-slate-200">{selectedEmail.sender}</span>
                <span className="font-mono text-[11px] text-cyan-400 ml-2">
                  &lt;{selectedEmail.email}&gt;
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">{selectedEmail.date}</span>
            </div>
          </div>

          <div className="flex-1 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
            {selectedEmail.body}
          </div>
        </div>
      ) : isComposing ? (
        /* Compose View */
        <form onSubmit={handleRequestSend} className="flex-1 flex flex-col p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-display font-bold text-sm text-white">New Transmission</h3>
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="Recipient (e.g. user@gmail.com)"
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Type your message here..."
            required
            className="flex-1 w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              {isGmailConnected ? 'Sending via Google Workspace API' : 'Sending via AERIX Node Sandbox'}
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </form>
      ) : (
        /* Mailbox List View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Folder Tabs */}
          <div className="p-3 space-y-2 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, senders, keywords..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* Folder Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'inbox', label: 'Inbox', icon: Inbox },
                { id: 'sent', label: 'Sent', icon: Send },
                { id: 'drafts', label: 'Drafts', icon: FileText },
                { id: 'trash', label: 'Trash', icon: Trash2 }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = folder === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setFolder(tab.id as any);
                    }}
                    className={`min-h-[32px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Item Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingGmail ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono text-cyan-300">Synchronizing with Gmail...</span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <MailIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No transmissions in {folder}</p>
              </div>
            ) : (
              filteredEmails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => handleSelectEmail(mail)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    mail.unread
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {mail.unread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            mail.unread ? 'font-bold text-white' : 'font-medium text-slate-300'
                          }`}
                        >
                          {mail.sender}
                        </span>
                      </div>
                      <h4
                        className={`text-xs mt-1 truncate ${
                          mail.unread ? 'font-bold text-cyan-200' : 'text-slate-300'
                        }`}
                      >
                        {mail.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {mail.snippet || mail.body}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500">{mail.date}</span>
                      <button
                        onClick={(e) => handleToggleStar(e, mail.id)}
                        className={`p-1 rounded-md ${
                          mail.starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
