import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Plus,
  History,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  X,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Edit3,
  RotateCcw,
  Sliders,
  Search,
  ArrowRight,
  Sparkles,
  Square,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Settings,
  MessageSquare
} from 'lucide-react';
import {
  ChatMessage,
  ChatSession,
  ChatMessageAttachment,
  ChatCommandAction,
  NavigationTab,
  AppId
} from '../types';
import { aiService } from '../services/aiService';
import { conversationService } from '../services/conversationService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soundEffects } from '../utils/sound';

interface AiPageProps {
  onOpenLaterPhase?: (title: string, desc: string, feat?: string) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onOpenApp?: (app: AppId) => void;
}

export const AiPage: React.FC<AiPageProps> = ({
  onNavigateTab,
  onOpenApp,
}) => {
  const { currentUser, isOffline } = useAuth();
  const { language, isRtl, t } = useLanguage();
  const userId = currentUser?.uid || 'guest-node';

  // API Key & Backend status
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(true);
  const [checkingConfig, setCheckingConfig] = useState<boolean>(true);

  // Conversations & Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default-session');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  // Messages & Stream State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Editing existing message
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  // Attachment state
  const [attachment, setAttachment] = useState<ChatMessageAttachment | null>(null);

  // Voice recognition
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // AI Model Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [responseLength, setResponseLength] = useState<'concise' | 'balanced' | 'comprehensive'>('balanced');

  // Command auto-navigation countdown
  const [navCountdown, setNavCountdown] = useState<{ action: ChatCommandAction; seconds: number } | null>(null);

  // Abort controller for Stop Generating
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend Gemini status on mount
  const verifyBackendStatus = useCallback(async () => {
    setCheckingConfig(true);
    try {
      const status = await aiService.checkStatus();
      setIsAiConfigured(status.configured);
      if (status.defaultModel) {
        setSelectedModel(status.defaultModel);
      }
    } catch {
      setIsAiConfigured(false);
    } finally {
      setCheckingConfig(false);
    }
  }, []);

  useEffect(() => {
    verifyBackendStatus();
  }, [verifyBackendStatus]);

  // Load user conversation list
  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      try {
        const loaded = await conversationService.getConversations(userId);
        if (!isMounted) return;

        if (loaded.length > 0) {
          setSessions(loaded);
          const first = loaded[0];
          setCurrentSessionId(first.id);
          setMessages(first.messages.length > 0 ? first.messages : getInitialGreeting());
          if (first.model) setSelectedModel(first.model);
          if (first.systemInstruction) setSystemInstruction(first.systemInstruction);
          if (first.temperature !== undefined) setTemperature(first.temperature);
        } else {
          // Create initial session
          const initialSess: ChatSession = {
            id: `sess-${Date.now()}`,
            userId,
            title: 'Neural Core Greeting',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: getInitialGreeting(),
            model: selectedModel,
            temperature,
          };
          setSessions([initialSess]);
          setCurrentSessionId(initialSess.id);
          setMessages(initialSess.messages);
          conversationService.saveConversation(userId, initialSess);
        }
      } catch (err) {
        console.warn('Could not load sessions:', err);
      }
    };

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Initial welcome greeting
  const getInitialGreeting = (): ChatMessage[] => [
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        'Hello! I am AERIX AI, your unified intelligence assistant.\n\nAsk me anything — from math calculations and coding to storytelling, translations, or controlling AERIX ONE apps.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    },
  ];

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Command auto-navigation timer
  useEffect(() => {
    if (!navCountdown) return;
    if (navCountdown.seconds <= 0) {
      executeCommand(navCountdown.action);
      setNavCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setNavCountdown((prev) => (prev ? { ...prev, seconds: prev.seconds - 1 } : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [navCountdown]);

  // Execute Command Action (e.g. Open Maps, Open Arcade, etc.)
  const executeCommand = (action: ChatCommandAction) => {
    soundEffects.playHapticClick();
    if (action.type === 'navigate') {
      if (action.target === 'maps' && onNavigateTab) onNavigateTab('maps');
      else if (action.target === 'shorts' && onNavigateTab) onNavigateTab('shorts');
      else if (action.target === 'apps' && onNavigateTab) onNavigateTab('apps');
      else if (action.target === 'home' && onNavigateTab) onNavigateTab('home');
    } else if (action.type === 'open_app') {
      if (onOpenApp) {
        onOpenApp(action.target as AppId);
      }
    }
  };

  // Sync active messages to current session in state & Firestore
  const persistCurrentMessages = (updatedMsgs: ChatMessage[]) => {
    setMessages(updatedMsgs);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updated = {
            ...s,
            messages: updatedMsgs,
            updatedAt: new Date().toISOString(),
          };
          // Auto title from first user message if untitled
          if (s.title === 'New Conversation' || s.title === 'Neural Core Greeting') {
            const firstUser = updatedMsgs.find((m) => m.role === 'user');
            if (firstUser) {
              updated.title = firstUser.content.slice(0, 32) + (firstUser.content.length > 32 ? '...' : '');
            }
          }
          conversationService.saveConversation(userId, updated);
          return updated;
        }
        return s;
      })
    );
  };

  // Switch to another conversation
  const handleSelectSession = (session: ChatSession) => {
    soundEffects.playHapticClick();
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    if (session.model) setSelectedModel(session.model);
    if (session.systemInstruction) setSystemInstruction(session.systemInstruction);
    if (session.temperature !== undefined) setTemperature(session.temperature);
    setHistoryOpen(false);
    setErrorMessage(null);
  };

  // Create a brand new conversation
  const handleNewChat = () => {
    soundEffects.playHapticClick();
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }

    const newSess: ChatSession = {
      id: `sess-${Date.now()}`,
      userId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: getInitialGreeting(),
      model: selectedModel,
      systemInstruction,
      temperature,
    };

    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
    setMessages(newSess.messages);
    setErrorMessage(null);
    setAttachment(null);
    setInput('');
    conversationService.saveConversation(userId, newSess);
  };

  // Rename a conversation
  const handleSaveRename = async (sessionId: string) => {
    if (!editTitleInput.trim()) {
      setEditingSessionId(null);
      return;
    }
    soundEffects.playHapticClick();
    const newTitle = editTitleInput.trim();
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
    setEditingSessionId(null);
    await conversationService.renameConversation(userId, sessionId, newTitle);
  };

  // Delete a conversation
  const handleDeleteSession = async (sessionId: string) => {
    soundEffects.playHapticClick();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    await conversationService.deleteConversation(userId, sessionId);

    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0]);
      } else {
        handleNewChat();
      }
    }
  };

  // Clear current conversation
  const handleClearCurrentChat = () => {
    soundEffects.playHapticClick();
    const fresh = getInitialGreeting();
    persistCurrentMessages(fresh);
    setErrorMessage(null);
  };

  // Stop Generation
  const handleStopGenerating = () => {
    soundEffects.playHapticClick();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (msgId: string, content: string) => {
    soundEffects.playHapticClick();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // fallback
    }
  };

  // Send message or trigger generation
  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt !== undefined ? customPrompt : input.trim();
    if ((!textToSend && !attachment) || isGenerating) return;

    soundEffects.playHapticClick();
    setErrorMessage(null);

    // Create user message
    const userMsgId = `usr-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend || (attachment ? `Attached: ${attachment.name}` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachment ? [attachment] : undefined,
    };

    const updatedHistory = [...messages, userMessage];
    persistCurrentMessages(updatedHistory);
    setInput('');
    const currentAttachment = attachment;
    setAttachment(null);

    // Check direct command heuristics
    const detectedCommand = aiService.detectUserNavigationIntent(textToSend);

    // Setup placeholder for assistant message
    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
      commandAction: detectedCommand || undefined,
    };

    const withAssistant = [...updatedHistory, initialAssistantMsg];
    persistCurrentMessages(withAssistant);
    setIsGenerating(true);

    // Setup abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Add length instruction to system prompt if set
    let activeSystemInstruction = systemInstruction;
    if (responseLength === 'concise') {
      activeSystemInstruction += '\nPlease provide concise, brief and direct responses.';
    } else if (responseLength === 'comprehensive') {
      activeSystemInstruction += '\nPlease provide in-depth, comprehensive and detailed explanations.';
    }

    // STRICT LANGUAGE CONTINUITY
    const hasArabicChars = /[\u0600-\u06FF]/.test(textToSend);
    if (hasArabicChars || language === 'ar') {
      activeSystemInstruction += '\nCRITICAL LANGUAGE INSTRUCTION: The user communicated in Arabic (العربية). You MUST generate your ENTIRE reply in fluent, natural Arabic. Do NOT switch to English under any circumstances.';
    } else {
      activeSystemInstruction += '\nCRITICAL LANGUAGE INSTRUCTION: The user communicated in English. You MUST generate your response in English.';
    }

    try {
      await aiService.streamChat({
        prompt: textToSend,
        history: updatedHistory.slice(0, -1),
        model: selectedModel,
        systemInstruction: activeSystemInstruction,
        temperature,
        image: currentAttachment?.type === 'image' && currentAttachment.url ? {
          name: currentAttachment.name,
          mimeType: currentAttachment.mimeType || 'image/jpeg',
          data: currentAttachment.url,
        } : undefined,
        file: currentAttachment?.type === 'file' && currentAttachment.content ? {
          name: currentAttachment.name,
          content: currentAttachment.content,
        } : undefined,
        signal: abortController.signal,
        onChunk: (chunkText) => {
          setMessages((prev) => {
            const next = [...prev];
            const target = next.find((m) => m.id === assistantMsgId);
            if (target) {
              target.content += chunkText;
            }
            return next;
          });
        },
        onError: (err) => {
          setIsGenerating(false);
          soundEffects.playTone(220, 0.2);
          const errText = err.message || 'Error occurred communicating with AERIX AI.';
          setErrorMessage(errText);
          setMessages((prev) => {
            const next = [...prev];
            const target = next.find((m) => m.id === assistantMsgId);
            if (target) {
              target.isError = true;
              if (!target.content) {
                target.content = `Neural Diagnostic Alert: ${errText}`;
              }
            }
            return next;
          });
        },
        onDone: (fullText) => {
          setIsGenerating(false);
          abortControllerRef.current = null;
          soundEffects.playSuccessBeep();

          // Extract commands like [COMMAND:OPEN_APP:games] or [COMMAND:NAVIGATE:maps]
          const { cleanText, action } = aiService.extractCommandAction(fullText);
          const finalAction = action || detectedCommand;

          setMessages((prev) => {
            const next = [...prev];
            const target = next.find((m) => m.id === assistantMsgId);
            if (target) {
              target.content = cleanText;
              if (finalAction) {
                target.commandAction = finalAction;
              }
            }
            persistCurrentMessages(next);
            return next;
          });

          // Trigger countdown if navigation command was detected
          if (finalAction) {
            setNavCountdown({ action: finalAction, seconds: 3 });
          }
        },
      });
    } catch (err: unknown) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (messages.length < 2 || isGenerating) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const userPrompt = messages[actualIndex].content;

    // Prune messages after that user message
    const trimmed = messages.slice(0, actualIndex);
    persistCurrentMessages(trimmed);
    handleSend(userPrompt);
  };

  // Edit user message and resubmit
  const handleSaveEditedMessage = (msgId: string) => {
    if (!editingMessageText.trim() || isGenerating) return;
    soundEffects.playHapticClick();

    const targetIndex = messages.findIndex((m) => m.id === msgId);
    if (targetIndex === -1) return;

    // Prune messages starting from this message
    const trimmed = messages.slice(0, targetIndex);
    persistCurrentMessages(trimmed);
    setEditingMessageId(null);

    handleSend(editingMessageText.trim());
  };

  // Image upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: 'image',
          mimeType: file.type,
          url: reader.result as string,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Document/Code file upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: 'file',
          content: (reader.result as string) || '',
          mimeType: file.type,
          size: file.size,
        });
      };
      reader.readAsText(file);
    }
  };

  // Voice Speech-To-Text toggle
  const handleVoiceToggle = () => {
    soundEffects.playHapticClick();
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback if browser doesn't expose Web Speech API in iframe
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const demoTranscripts = [
          'What are the key capabilities of AERIX ONE?',
          'Open Maps and show high contrast navigation',
          'Write a TypeScript function to parse telemetry data',
          'Summarize system status and security levels',
        ];
        const chosen = demoTranscripts[Math.floor(Math.random() * demoTranscripts.length)];
        setInput(chosen);
      }, 1800);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Format inline styling like bold, backticks, and bullet points
  const renderInlineFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for bullet list item
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;

      // Split line by bold (**text**) and code (`text`)
      const tokens = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      const formattedLine = (
        <span key={lineIdx} className={isBullet ? 'flex items-start gap-1.5 ml-2 my-0.5' : 'block'}>
          {isBullet && <span className="text-cyan-400 text-xs leading-none select-none">•</span>}
          <span>
            {tokens.map((token, tokIdx) => {
              if (token.startsWith('**') && token.endsWith('**')) {
                return (
                  <strong key={tokIdx} className="font-bold text-white">
                    {token.slice(2, -2)}
                  </strong>
                );
              }
              if (token.startsWith('`') && token.endsWith('`')) {
                return (
                  <code key={tokIdx} className="px-1 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-cyan-300 border border-slate-800">
                    {token.slice(1, -1)}
                  </code>
                );
              }
              return token;
            })}
          </span>
        </span>
      );

      return formattedLine;
    });
  };

  // Format code blocks & text in message
  const renderMessageContent = (content: string) => {
    // Check for Markdown code blocks (```language ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return (
      <div className="space-y-2">
        {parts.map((p, idx) => {
          if (p.type === 'code' && p.code) {
            const codeString = p.code;
            return (
              <div key={idx} className="my-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <span className="uppercase text-[9px] font-bold text-cyan-400">{p.language}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeString);
                      soundEffects.playHapticClick();
                    }}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-emerald-300">
                  <code>{codeString}</code>
                </pre>
              </div>
            );
          }
          return (
            <div key={idx} className="leading-relaxed">
              {renderInlineFormattedText(p.content || '')}
            </div>
          );
        })}
      </div>
    );
  };

  // Filtered session list for archives
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggestions row
  const promptSuggestions = [
    'احسب 847 × 392 واشرح لي الطريقة',
    'اكتب لي قصة قصيرة عن لص في نيويورك',
    'ما هو 25% من 840؟',
    'Open Maps',
    'Open Games',
    'Explain quantum computing',
  ];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-[calc(100vh-125px)] text-slate-100 relative overflow-hidden select-none">
      {/* 1. Missing API Key Setup Screen */}
      {!isAiConfigured && !checkingConfig && (
        <div className="absolute inset-0 z-50 bg-[#040711] p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full max-w-sm my-auto aerix-glass-elevated rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-white">
                AERIX Neural Core Setup
              </h2>
              <span className="text-xs text-amber-300 font-mono">
                GEMINI_API_KEY Required
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              AERIX AI runs on the official server-side Gemini 3 series intelligence. To activate the central cognitive engine, attach your API key in the AI Studio environment secrets:
            </p>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left font-mono text-[11px] text-cyan-300 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Required Variable:</div>
              <div className="text-white font-bold">GEMINI_API_KEY="AIzaSy..."</div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={verifyBackendStatus}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Verify AI Connection</span>
              </button>

              <button
                onClick={() => setIsAiConfigured(true)}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Inspect Archived Conversations Offline
              </button>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500">
            AERIX ONE Cognitive Node · Client Air-Gapped Security
          </div>
        </div>
      )}

      {/* 2. Top Control Bar */}
      <div className="p-3 border-b border-slate-800/80 aerix-glass flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white flex items-center gap-1.5">
              <span>AERIX AI</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan-950/80 text-cyan-400 rounded-full border border-cyan-800">
                {selectedModel === 'gemini-3.1-pro-preview' ? 'Pro 3.1' : 'Flash 3.8'}
              </span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] block">
              {sessions.find((s) => s.id === currentSessionId)?.title || 'Current Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings Modal Trigger */}
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setSettingsOpen(true);
            }}
            className="p-2 rounded-xl aerix-glass-card hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Model Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl aerix-glass-card hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setHistoryOpen(true);
            }}
            className="p-2 rounded-xl aerix-glass-card hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Conversation Archives"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Auto-Navigation Countdown Banner */}
      {navCountdown && (
        <div className="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-slate-950 p-2.5 px-4 text-xs font-semibold flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
            <span>
              Navigating to <strong>{navCountdown.action.label}</strong> in {navCountdown.seconds}s...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNavCountdown(null)}
              className="px-2 py-0.5 rounded bg-black/20 text-slate-900 font-bold text-[10px] hover:bg-black/30"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                executeCommand(navCountdown.action);
                setNavCountdown(null);
              }}
              className="px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-bold text-[10px] shadow"
            >
              Go Now →
            </button>
          </div>
        </div>
      )}

      {/* 4. Conversation History Drawer (Slide-Over) */}
      {historyOpen && (
        <div className="absolute inset-0 z-40 bg-[#090d16]/95 backdrop-blur-md flex flex-col p-4 animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Conversation History
            </h3>
            <button
              onClick={() => setHistoryOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative my-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* New Chat trigger inside drawer */}
          <button
            onClick={() => {
              handleNewChat();
              setHistoryOpen(false);
            }}
            className="w-full py-2.5 px-3 mb-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Conversation</span>
          </button>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
            {filteredSessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              const isEditing = editingSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(sess.id)}
                        className="p-1 rounded bg-cyan-500 text-slate-950"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 rounded text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => handleSelectSession(sess)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="font-semibold text-xs text-white truncate">
                          {sess.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {new Date(sess.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingSessionId(sess.id);
                            setEditTitleInput(sess.title);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(sess.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drawer footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleClearCurrentChat}
              className="text-slate-400 hover:text-rose-400 font-mono text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Current Chat</span>
            </button>
            <span className="text-[10px] font-mono text-slate-500">
              {sessions.length} Threads
            </span>
          </div>
        </div>
      )}

      {/* 5. AI Settings Modal */}
      {settingsOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
          <div className="w-full max-w-md mx-auto bg-[#090d16] rounded-t-3xl border-t border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                AERIX AI Parameters
              </span>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Intelligence Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.8-flash')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedModel === 'gemini-3.8-flash'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">AERIX Flash 3.8</div>
                  <div className="text-[9px] font-mono text-cyan-300 mt-0.5">High Speed & Logic</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedModel === 'gemini-3.1-pro-preview'
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">AERIX Pro 3.1</div>
                  <div className="text-[9px] font-mono text-purple-300 mt-0.5">Deep STEM & Code</div>
                </button>
              </div>
            </div>

            {/* Response Length preference */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Response Profile
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {(['concise', 'balanced', 'comprehensive'] as const).map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setResponseLength(len)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono capitalize transition-all ${
                      responseLength === len
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                <span>Creativity (Temperature)</span>
                <span className="text-cyan-400 font-bold">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* Custom System Instruction */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Custom System Persona
              </label>
              <textarea
                rows={2}
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="e.g. Always respond in bullet points and emphasize aerospace metrics..."
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* 6. Message Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isEditing = editingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border text-xs ${
                  isUser
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white shadow-md'
                    : msg.isError
                    ? 'bg-rose-950/40 border border-rose-800 text-rose-200'
                    : 'aerix-glass border border-slate-800/80 text-slate-200'
                }`}
              >
                {/* Image or File Attachment Badge */}
                {msg.attachments?.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2 mb-1.5"
                  >
                    {att.type === 'image' && att.url ? (
                      <img
                        src={att.url}
                        alt="attachment"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <Paperclip className="w-4 h-4 text-cyan-300 ml-1" />
                    )}
                    <span className="truncate text-[11px] font-mono">{att.name}</span>
                  </div>
                ))}

                {/* Inline Editing for User Message */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={editingMessageText}
                      onChange={(e) => setEditingMessageText(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-400 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-2 py-1 rounded text-[10px] text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEditedMessage(msg.id)}
                        className="px-2.5 py-1 rounded bg-cyan-400 text-slate-950 font-bold text-[10px]"
                      >
                        Save & Resend
                      </button>
                    </div>
                  </div>
                ) : (
                  renderMessageContent(msg.content)
                )}

                {/* Interactive Command Action Card */}
                {msg.commandAction && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-between gap-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[11px] font-bold text-white">
                        {msg.commandAction.label}
                      </div>
                    </div>
                    <button
                      onClick={() => executeCommand(msg.commandAction!)}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-transform active:scale-95"
                    >
                      <span>Open Now</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Bottom Meta & Action Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <span>{msg.timestamp}</span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1 rounded hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Edit User Message Button */}
                    {isUser && !isGenerating && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditingMessageText(msg.content);
                        }}
                        className="p-1 rounded hover:text-white transition-colors"
                        title="Edit Message"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Generation Indicator / Pulsing state */}
        {isGenerating && (
          <div className="flex items-center justify-between p-3 rounded-2xl aerix-glass border border-cyan-500/30 text-xs text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="font-mono text-[11px]">AERIX Neural Core streaming...</span>
            </div>
            <button
              onClick={handleStopGenerating}
              className="px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900 text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Generating</span>
            </button>
          </div>
        )}

        {/* Error Alert Box with Retry */}
        {errorMessage && !isGenerating && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="font-semibold text-xs text-rose-300">Neural Request Interrupted</div>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    handleRegenerate();
                  }}
                  className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Response</span>
                </button>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 7. Suggested Prompts Chips */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {promptSuggestions.map((sug) => (
          <button
            key={sug}
            onClick={() => handleSend(sug)}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors whitespace-nowrap active:scale-95 shrink-0"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* 8. Input Composer Tray */}
      <div className="p-3 aerix-glass border-t border-slate-800/80 shrink-0 space-y-2">
        {/* Attachment preview badge */}
        {attachment && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs">
            <div className="flex items-center gap-2 truncate">
              {attachment.type === 'image' && attachment.url ? (
                <img
                  src={attachment.url}
                  alt="preview"
                  className="w-7 h-7 object-cover rounded-lg border border-cyan-500/50"
                />
              ) : (
                <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="truncate font-mono text-[11px] text-slate-200">{attachment.name}</span>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 text-slate-400 hover:text-rose-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Voice recording pulsing banner */}
        {isRecording && (
          <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-between text-xs text-cyan-300 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[11px]">Listening... Speak command or query</span>
            </div>
            <button
              onClick={handleVoiceToggle}
              className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 underline"
            >
              Done
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-1.5"
        >
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".txt,.md,.json,.js,.ts,.tsx,.csv,.py"
            className="hidden"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors ${
              isRecording
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'aerix-glass-card text-slate-400 hover:text-cyan-300'
            }`}
            title="Voice Speech Input"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="min-h-[44px] min-w-[44px] rounded-xl aerix-glass-card text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors"
            title="Attach Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Attach Document Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] min-w-[44px] rounded-xl aerix-glass-card text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors"
            title="Attach Document or Code"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Message Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            dir={isRtl ? 'rtl' : 'ltr'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('ai.placeholder', 'Ask AERIX AI anything in Arabic or English...')}
            className="flex-1 min-h-[44px] max-h-32 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
          />

          {/* Send or Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGenerating}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-rose-600/30"
              title="Stop Generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isGenerating}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-slate-950 font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-cyan-500/20"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
