/**
 * AERIX ONE - Real Gmail Service Integration (Google Workspace)
 * Client-side OAuth token retrieval via Firebase Auth & direct REST calls to Gmail API v1.
 * Access token kept in memory only.
 */

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { MailMessage } from '../types';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly'
];

let cachedGmailToken: string | null = null;
let cachedGmailUserEmail: string | null = null;

// Helper to base64url encode string
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const emailService = {
  isExternalConnected: false,
  phase: 'Phase 4 - Live Gmail Integration',

  isConnected(): boolean {
    return Boolean(cachedGmailToken);
  },

  getConnectedEmail(): string | null {
    return cachedGmailUserEmail || auth.currentUser?.email || null;
  },

  async connectGmail(): Promise<string> {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Failed to obtain Gmail access token from Google Auth.');
      }

      cachedGmailToken = credential.accessToken;
      cachedGmailUserEmail = result.user.email;
      this.isExternalConnected = true;
      return cachedGmailToken;
    } catch (err: any) {
      console.error('Gmail OAuth connection failed:', err);
      throw err;
    }
  },

  disconnectGmail() {
    cachedGmailToken = null;
    cachedGmailUserEmail = null;
    this.isExternalConnected = false;
  },

  /**
   * Fetch recent messages from Gmail inbox
   */
  async listMessages(folder: 'inbox' | 'sent' | 'trash' = 'inbox'): Promise<MailMessage[]> {
    if (!cachedGmailToken) {
      throw new Error('Gmail is not connected. Please authenticate with Google first.');
    }

    const q = folder === 'sent' ? 'in:sent' : folder === 'trash' ? 'in:trash' : 'in:inbox';
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(q)}`,
      {
        headers: {
          Authorization: `Bearer ${cachedGmailToken}`,
          Accept: 'application/json'
        }
      }
    );

    if (!listRes.ok) {
      if (listRes.status === 401) {
        cachedGmailToken = null;
        throw new Error('Gmail session expired. Please reconnect.');
      }
      throw new Error(`Gmail API error: ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    const messageIds: { id: string; threadId: string }[] = listData.messages || [];

    if (messageIds.length === 0) {
      return [];
    }

    // Fetch message details in parallel
    const details = await Promise.all(
      messageIds.slice(0, 15).map(async (m) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${cachedGmailToken}`,
                Accept: 'application/json'
              }
            }
          );
          if (!detailRes.ok) return null;
          return await detailRes.json();
        } catch {
          return null;
        }
      })
    );

    const parsed: MailMessage[] = [];

    details.forEach((raw) => {
      if (!raw) return;

      const headers = raw.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const fromHeader = getHeader('From');
      const subject = getHeader('Subject') || '(No Subject)';
      const dateHeader = getHeader('Date');

      // Extract sender name and clean email
      let sender = fromHeader;
      let email = fromHeader;
      const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        sender = match[1].replace(/["']/g, '').trim() || match[2];
        email = match[2];
      }

      // Extract snippet and body text
      const snippet = raw.snippet || '';
      let body = snippet;

      // Extract plain text payload if available
      if (raw.payload?.body?.data) {
        try {
          body = atob(raw.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch {
          // ignore
        }
      } else if (raw.payload?.parts) {
        const textPart = raw.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          try {
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } catch {
            // ignore
          }
        }
      }

      const labelIds: string[] = raw.labelIds || [];
      const unread = labelIds.includes('UNREAD');
      const starred = labelIds.includes('STARRED');

      parsed.push({
        id: raw.id,
        sender,
        email,
        subject,
        snippet,
        body,
        date: dateHeader ? new Date(dateHeader).toLocaleDateString() : 'Recent',
        unread,
        starred,
        folder
      });
    });

    return parsed;
  },

  /**
   * Send email using Gmail REST API
   * RFC 2822 formatted raw base64url payload
   */
  async sendEmail(mail: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; id: string }> {
    if (!cachedGmailToken) {
      throw new Error('Gmail is not connected. Please authenticate with Google first.');
    }

    const senderEmail = this.getConnectedEmail() || 'me';

    const rfc822Lines = [
      `From: ${senderEmail}`,
      `To: ${mail.to.trim()}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(mail.subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      mail.body
    ];

    const rawMessage = rfc822Lines.join('\r\n');
    const encodedRaw = toBase64Url(rawMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedGmailToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedRaw })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Failed to send email (${res.status})`);
    }

    const data = await res.json();
    return { success: true, id: data.id };
  },

  /**
   * Delete or trash message in Gmail
   */
  async trashMessage(messageId: string): Promise<void> {
    if (!cachedGmailToken) return;

    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedGmailToken}`,
        Accept: 'application/json'
      }
    });
  }
};
