/**
 * AERIX ONE - AI Service (Phase 3 Full-Stack Gemini Integration)
 * Securely calls server-side proxy endpoints (/api/ai/chat) with streaming and abort control.
 * Private API keys never touch the client browser.
 */

import { ChatMessage, ChatCommandAction } from '../types';

export interface AIStatusResponse {
  configured: boolean;
  defaultModel: string;
  availableModels: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export interface StreamChatParams {
  prompt: string;
  history?: ChatMessage[];
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  image?: {
    name: string;
    mimeType: string;
    data: string; // Base64
  };
  file?: {
    name: string;
    content: string;
  };
  signal?: AbortSignal;
  onChunk: (chunkText: string) => void;
  onError: (error: Error) => void;
  onDone: (fullText: string) => void;
}

export const aiService = {
  isConfigured: false,

  // Query server status to confirm if Gemini API key is configured
  async checkStatus(): Promise<AIStatusResponse> {
    try {
      const res = await fetch('/api/ai/status', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: AIStatusResponse = await res.json();
      this.isConfigured = data.configured;
      return data;
    } catch {
      return {
        configured: false,
        defaultModel: 'gemini-3.8-flash',
        availableModels: [
          { id: 'gemini-3.8-flash', name: 'AERIX Quantum (Fast)', description: 'Balanced, low-latency general intelligence' },
          { id: 'gemini-3.1-pro-preview', name: 'AERIX Deep Reasoning (Pro)', description: 'Complex STEM, code generation & multi-step thinking' },
          { id: 'gemini-3.1-flash-lite', name: 'AERIX Pulse (Ultra-Fast)', description: 'Minimal latency responses and summaries' },
        ],
      };
    }
  },

  // Stream chat responses from the backend using Server-Sent Events (SSE)
  async streamChat(params: StreamChatParams): Promise<void> {
    const {
      prompt,
      history = [],
      model = 'gemini-3.8-flash',
      systemInstruction,
      temperature = 0.7,
      image,
      file,
      signal,
      onChunk,
      onError,
      onDone,
    } = params;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          prompt,
          history: history.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: msg.content,
          })),
          model,
          systemInstruction,
          temperature,
          image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
          file: file ? { name: file.name, content: file.content } : undefined,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        let errMessage = `Request failed (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('Response body is empty or streaming is unsupported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.slice(5).trim();
          if (dataPayload === '[DONE]') {
            onDone(accumulatedText);
            return;
          }

          try {
            const parsed = JSON.parse(dataPayload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (typeof parsed.text === 'string') {
              accumulatedText += parsed.text;
              onChunk(parsed.text);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== dataPayload) {
              // Could be raw JSON parsing issue for partial chunk
            }
          }
        }
      }

      onDone(accumulatedText);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        // User clicked Stop Generating
        return;
      }
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },

  // Parse Command Center actions from AI responses or user input
  extractCommandAction(text: string): { cleanText: string; action: ChatCommandAction | null } {
    let cleanText = text;
    let action: ChatCommandAction | null = null;

    // Check for [COMMAND:OPEN_APP:<appId>]
    const appMatch = text.match(/\*{0,2}`{0,2}\[COMMAND:OPEN_APP:([a-z0-9_-]+)\]`{0,2}\*{0,2}/i);
    if (appMatch) {
      cleanText = cleanText.replace(appMatch[0], '').trim();
      const targetApp = appMatch[1].toLowerCase();
      action = {
        type: 'open_app',
        target: targetApp,
        label: `Launch ${targetApp.charAt(0).toUpperCase() + targetApp.slice(1)}`,
      };
    }

    // Check for [COMMAND:NAVIGATE:<tab>]
    const navMatch = text.match(/\*{0,2}`{0,2}\[COMMAND:NAVIGATE:([a-z0-9_-]+)\]`{0,2}\*{0,2}/i);
    if (navMatch) {
      cleanText = cleanText.replace(navMatch[0], '').trim();
      const targetTab = navMatch[1].toLowerCase();
      action = {
        type: 'navigate',
        target: targetTab,
        label: `Navigate to ${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`,
      };
    }

    return { cleanText, action };
  },

  // Client-side intent heuristics for user input fallback
  detectUserNavigationIntent(prompt: string): ChatCommandAction | null {
    const p = prompt.toLowerCase().trim();
    
    // Direct command matches
    if (p.includes('open maps') || p.includes('launch maps') || p.includes('go to maps')) {
      return { type: 'navigate', target: 'maps', label: 'Open Maps' };
    }
    if (p.includes('open shorts') || p.includes('launch shorts') || p.includes('watch shorts')) {
      return { type: 'navigate', target: 'shorts', label: 'Open Shorts' };
    }
    if (p.includes('open games') || p.includes('launch games') || p.includes('play games') || p.includes('open arcade')) {
      return { type: 'open_app', target: 'games', label: 'Open Arcade' };
    }
    if (p.includes('open mail') || p.includes('check mail') || p.includes('launch mail')) {
      return { type: 'open_app', target: 'mail', label: 'Open Mail' };
    }
    if (p.includes('open calls') || p.includes('phone') || p.includes('dialer')) {
      return { type: 'open_app', target: 'calls', label: 'Open Calls' };
    }
    if (p.includes('open files') || p.includes('launch files') || p.includes('my files')) {
      return { type: 'open_app', target: 'files', label: 'Open Files' };
    }
    if (p.includes('open camera') || p.includes('take photo') || p.includes('take picture')) {
      return { type: 'open_app', target: 'camera', label: 'Open Camera' };
    }
    if (p.includes('open music') || p.includes('play music') || p.includes('launch music')) {
      return { type: 'open_app', target: 'music', label: 'Open Music' };
    }
    if (p.includes('open notes') || p.includes('write note') || p.includes('my notes')) {
      return { type: 'open_app', target: 'notes', label: 'Open Notes' };
    }
    if (p.includes('open browser') || p.includes('launch browser') || p.includes('surf web')) {
      return { type: 'open_app', target: 'browser', label: 'Open Browser' };
    }
    if (p.includes('open forms') || p.includes('google forms') || p.includes('launch forms') || p.includes('survey')) {
      return { type: 'open_app', target: 'forms', label: 'Open Google Forms' };
    }
    if (p.includes('open slides') || p.includes('google slides') || p.includes('presentations')) {
      return { type: 'open_app', target: 'slides', label: 'Open Google Slides' };
    }
    if (p.includes('open settings') || p.includes('system settings') || p.includes('preferences')) {
      return { type: 'open_app', target: 'settings', label: 'Open Settings' };
    }
    if (p.includes('go home') || p.includes('open home') || p.includes('dashboard')) {
      return { type: 'navigate', target: 'home', label: 'Go Home' };
    }
    if (p.includes('open apps') || p.includes('app launcher') || p.includes('all apps')) {
      return { type: 'navigate', target: 'apps', label: 'Open Apps' };
    }

    return null;
  }
};
