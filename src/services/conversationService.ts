/**
 * AERIX ONE - Conversation Service
 * Manages user chat sessions in Firebase Firestore with local offline fallback.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, sanitizeForFirestore, OperationType } from './firebase';
import { ChatSession, ChatMessage } from '../types';

export const conversationService = {
  // Get storage key for local offline caching
  getLocalKey(userId: string): string {
    return `aerix_conversations_${userId || 'guest'}`;
  },

  // Load all conversation summaries
  async getConversations(userId: string): Promise<ChatSession[]> {
    // 1. Try local cache first
    let cachedSessions: ChatSession[] = [];
    try {
      const stored = localStorage.getItem(this.getLocalKey(userId));
      if (stored) {
        cachedSessions = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    // 2. If Firebase is not configured or user is offline or guest, return local cache
    if (!isFirebaseConfigured || !navigator.onLine || !userId || userId === 'local-guest-node') {
      return cachedSessions;
    }

    // 3. Query from Firestore
    const collPath = `users/${userId}/conversations`;
    try {
      const q = query(collection(db, collPath), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const cloudSessions: ChatSession[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        cloudSessions.push({
          id: d.id,
          userId,
          title: data.title || 'Untitled Conversation',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messages: data.messages || [],
          model: data.model || 'gemini-3.8-flash',
          systemInstruction: data.systemInstruction,
          temperature: data.temperature,
        });
      });

      // Update local cache
      try {
        localStorage.setItem(this.getLocalKey(userId), JSON.stringify(cloudSessions));
      } catch {
        // ignore
      }

      return cloudSessions.length > 0 ? cloudSessions : cachedSessions;
    } catch (err) {
      console.warn('Could not load conversations from Firestore, using local cache:', err);
      return cachedSessions;
    }
  },

  // Save or update a conversation session
  async saveConversation(userId: string, session: ChatSession): Promise<void> {
    const updatedSession = {
      ...session,
      userId,
      updatedAt: new Date().toISOString(),
    };

    // 1. Always update local storage
    try {
      const key = this.getLocalKey(userId);
      const existing: ChatSession[] = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        existing[index] = updatedSession;
      } else {
        existing.unshift(updatedSession);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // ignore
    }

    // 2. Sync to Firestore if authenticated & online
    if (!isFirebaseConfigured || !navigator.onLine || !userId || userId === 'local-guest-node') {
      return;
    }

    const docPath = `users/${userId}/conversations/${session.id}`;
    try {
      // Clean up message attachments and remove undefined fields
      const sanitizedMessages = session.messages.map((m) => {
        const clean: Record<string, any> = {
          id: m.id,
          role: m.role,
          content: m.content || '',
          timestamp: m.timestamp || new Date().toISOString(),
        };
        if (m.model) clean.model = m.model;
        if (m.isError !== undefined) clean.isError = m.isError;
        if (m.commandAction) clean.commandAction = m.commandAction;
        if (m.attachments && m.attachments.length > 0) {
          clean.attachments = m.attachments.map((att) => ({
            name: att.name || 'Attachment',
            type: att.type || 'file',
            mimeType: att.mimeType || 'application/octet-stream',
            // Keep URL or truncate raw base64 if excessive
            url: att.url?.startsWith('data:') && att.url.length > 50000 ? '[Inline Image Cached]' : (att.url || ''),
          }));
        }
        return clean;
      });

      const payload = sanitizeForFirestore({
        id: session.id,
        userId,
        title: session.title || 'Untitled Conversation',
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: updatedSession.updatedAt,
        messages: sanitizedMessages,
        model: session.model || 'gemini-3.8-flash',
        systemInstruction: session.systemInstruction || '',
        temperature: typeof session.temperature === 'number' ? session.temperature : 0.7,
      });

      await setDoc(doc(db, 'users', userId, 'conversations', session.id), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  },

  // Rename a conversation
  async renameConversation(userId: string, conversationId: string, newTitle: string): Promise<void> {
    const key = this.getLocalKey(userId);
    try {
      const existing: ChatSession[] = JSON.parse(localStorage.getItem(key) || '[]');
      const target = existing.find((s) => s.id === conversationId);
      if (target) {
        target.title = newTitle;
        target.updatedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured || !navigator.onLine || !userId || userId === 'local-guest-node') {
      return;
    }

    const docPath = `users/${userId}/conversations/${conversationId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'conversations', conversationId), sanitizeForFirestore({
        title: newTitle || 'Untitled Conversation',
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  },

  // Delete a conversation
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const key = this.getLocalKey(userId);
    try {
      const existing: ChatSession[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((s) => s.id !== conversationId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured || !navigator.onLine || !userId || userId === 'local-guest-node') {
      return;
    }

    const docPath = `users/${userId}/conversations/${conversationId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  },

  // Clear all conversations for a user
  async clearAllConversations(userId: string): Promise<void> {
    const key = this.getLocalKey(userId);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured || !navigator.onLine || !userId || userId === 'local-guest-node') {
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'conversations'));
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
    } catch (err) {
      console.warn('Could not clear all Firestore conversations:', err);
    }
  },

  // Search user conversations
  async searchConversations(userId: string, queryText: string): Promise<ChatSession[]> {
    const all = await this.getConversations(userId);
    const q = queryText.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessage = s.messages.some((m) => m.content.toLowerCase().includes(q));
      return matchTitle || matchMessage;
    });
  },
};
