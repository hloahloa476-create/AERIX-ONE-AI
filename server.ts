import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Not JSON
    }
    return err.message;
  }
  return String(err);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Helper to initialize the GenAI client
  const getAiClient = (): GoogleGenAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Status Endpoint
  app.get('/api/ai/status', (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);
    res.json({
      configured: isConfigured,
      defaultModel: 'gemini-3.1-flash-lite',
      availableModels: [
        { id: 'gemini-3.1-flash-lite', name: 'AERIX Quantum (Fast)', description: 'Ultra-fast, lowest latency general intelligence' },
        { id: 'gemini-3.8-flash', name: 'AERIX Standard (Balanced)', description: 'Balanced reasoning, writing & analysis' },
        { id: 'gemini-3.1-pro-preview', name: 'AERIX Deep Reasoning (Pro)', description: 'Complex logic, code generation & multi-step thinking' }
      ]
    });
  });

  // AI Chat Endpoint with Streaming (SSE)
  app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'AERIX AI API key is not configured in server environment. Please set GEMINI_API_KEY in the environment secrets.',
        code: 'API_KEY_MISSING'
      });
      return;
    }

    const {
      prompt,
      history = [],
      model = 'gemini-3.1-flash-lite',
      systemInstruction,
      temperature,
      image,
      file,
      stream = true
    } = req.body;

    if (!prompt && !image && !file) {
      res.status(400).json({ error: 'Prompt or attachment is required.' });
      return;
    }

    // Validate model selection
    const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.1-flash-lite';

    // Format chat history: Ensure Gemini conversation history starts with a user turn
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];

    // Prior conversation history (limit to last 20 for memory safety)
    let hasStartedWithUser = false;
    if (Array.isArray(history)) {
      for (const msg of history.slice(-20)) {
        if (!msg || !msg.content) continue;
        if (msg.role === 'user') {
          hasStartedWithUser = true;
        }
        if (hasStartedWithUser) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    // Format current turn
    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (image && image.data) {
      const base64Clean = image.data.replace(/^data:[^;]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: base64Clean
        }
      });
    }

    let combinedPrompt = prompt || '';
    if (file && file.name && file.content) {
      combinedPrompt += `\n\n[Attached File: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\``;
    }

    if (combinedPrompt.trim()) {
      currentParts.push({ text: combinedPrompt });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const defaultSystemInstruction =
      'You are AERIX AI, an intelligent, helpful, high-speed, and natural AI assistant inside AERIX ONE.\n' +
      'Directives:\n' +
      '- CRITICAL LANGUAGE DIRECTIVE: Always respond in the EXACT same language as the user\'s message or requested language. If the user writes in Arabic (العربية), respond completely and fluently in Arabic. If the user writes in English, respond in English. Do NOT switch to English when the user speaks Arabic.\n' +
      '- Answer the user\'s message directly, intelligently, and without redundant repetitive openings or robot boilerplate.\n' +
      '- If the user asks for a calculation or math problem, calculate accurately, show the result clearly, and explain the steps step-by-step.\n' +
      '- If the user asks for creative writing, a story, code, or an explanation, produce a rich, engaging, and complete response directly without preamble.\n' +
      '- Use clean Markdown (bold, bullet points, headers, numbered lists, and code blocks) for readability.\n' +
      '- ONLY include an internal command token like [COMMAND:OPEN_APP:games] or [COMMAND:NAVIGATE:maps] if the user EXPLICITLY asks to open or navigate to an app (e.g., "open maps", "open games", "open camera", "open mail"). NEVER include command tokens for general questions, calculations, writing, or normal conversation.';

    const config: { systemInstruction?: string; temperature?: number } = {
      systemInstruction: systemInstruction ? `${defaultSystemInstruction}\n\nUser instructions: ${systemInstruction}` : defaultSystemInstruction,
    };

    if (typeof temperature === 'number' && !isNaN(temperature)) {
      config.temperature = Math.max(0, Math.min(1.0, temperature));
    }

    let isAborted = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        isAborted = true;
      }
    });

    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      try {
        let responseStream;
        try {
          responseStream = await ai.models.generateContentStream({
            model: selectedModel,
            contents: contents,
            config: config
          });
        } catch (firstErr: unknown) {
          const formatted = formatErrorMessage(firstErr);
          if (
            (formatted.includes('503') || formatted.includes('high demand') || formatted.includes('UNAVAILABLE') || formatted.includes('overloaded')) &&
            selectedModel !== 'gemini-3.1-flash-lite'
          ) {
            console.warn(`[AERIX AI] ${selectedModel} is unavailable, gracefully falling back to gemini-3.1-flash-lite`);
            responseStream = await ai.models.generateContentStream({
              model: 'gemini-3.1-flash-lite',
              contents: contents,
              config: config
            });
          } else {
            throw firstErr;
          }
        }

        for await (const chunk of responseStream) {
          if (isAborted) break;
          // chunk.text is a property in @google/genai
          const text = chunk.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        if (!isAborted) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
      } catch (err: unknown) {
        console.error('Gemini Stream Error:', err);
        const errMsg = formatErrorMessage(err);
        if (!res.headersSent) {
          res.status(500).json({ error: errMsg });
        } else {
          res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
          res.end();
        }
      }
    } else {
      // Non-streaming fallback
      try {
        let response;
        try {
          response = await ai.models.generateContent({
            model: selectedModel,
            contents: contents,
            config: config
          });
        } catch (firstErr: unknown) {
          const formatted = formatErrorMessage(firstErr);
          if (
            (formatted.includes('503') || formatted.includes('high demand') || formatted.includes('UNAVAILABLE') || formatted.includes('overloaded')) &&
            selectedModel !== 'gemini-3.1-flash-lite'
          ) {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: contents,
              config: config
            });
          } else {
            throw firstErr;
          }
        }
        res.json({ text: response.text || '' });
      } catch (err: unknown) {
        console.error('Gemini Generate Error:', err);
        const errMsg = formatErrorMessage(err);
        res.status(500).json({ error: errMsg });
      }
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[AERIX ONE] Full-stack engine online on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[AERIX ONE] Failed to start server:', err);
  process.exit(1);
});
