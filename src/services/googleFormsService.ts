/**
 * AERIX ONE - Google Forms & Drive Workspace Service
 * Manages Google Forms API calls, form creation, question authoring,
 * response analysis, and Google Drive file operations.
 * 
 * Complies with Google Workspace integration skill requirements:
 * - Client-side in-memory token caching (never stored in localStorage/sessionStorage)
 * - Confirmation required before deleting forms
 * - Direct REST API execution using OAuth Bearer headers
 */

import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

export const FORMS_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

export interface GoogleFormSummary {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  description?: string;
}

export interface GoogleFormQuestionOption {
  value: string;
}

export interface GoogleFormQuestionItem {
  itemId?: string;
  title: string;
  description?: string;
  type: 'TEXT' | 'PARAGRAPH_TEXT' | 'RADIO' | 'CHECKBOX' | 'DROP_DOWN' | 'SCALE';
  required?: boolean;
  options?: GoogleFormQuestionOption[];
  scaleLow?: number;
  scaleHigh?: number;
  scaleLowLabel?: string;
  scaleHighLabel?: string;
}

export interface GoogleFormDetail {
  formId: string;
  info: {
    title: string;
    documentTitle?: string;
    description?: string;
  };
  responderUri?: string;
  items?: Array<{
    itemId: string;
    title: string;
    description?: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
        textQuestion?: { paragraph: boolean };
        choiceQuestion?: {
          type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
          options: Array<{ value: string }>;
        };
        scaleQuestion?: {
          low: number;
          high: number;
          lowLabel?: string;
          highLabel?: string;
        };
      };
    };
  }>;
}

export interface FormResponseAnswer {
  questionId: string;
  textAnswers?: {
    answers: Array<{ value: string }>;
  };
}

export interface GoogleFormSubmission {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<string, FormResponseAnswer>;
}

// In-Memory Token Cache (Never persist to localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;

export const googleFormsService = {
  // In-memory token management
  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  setAccessToken(token: string | null) {
    cachedAccessToken = token;
  },

  clearAccessToken() {
    cachedAccessToken = null;
  },

  hasValidToken(): boolean {
    return Boolean(cachedAccessToken && cachedAccessToken.length > 10);
  },

  /**
   * Request / Refresh Google Workspace OAuth token with Forms & Drive scopes
   */
  async requestWorkspaceAccess(): Promise<{ user: User; accessToken: string }> {
    const provider = new GoogleAuthProvider();
    FORMS_WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Workspace OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken
    };
  },

  /**
   * List Google Forms files from user's Google Drive
   */
  async listForms(): Promise<GoogleFormSummary[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required. Please connect your Google account.');
    }

    const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
    const fields = encodeURIComponent('files(id,name,createdTime,modifiedTime,webViewLink,description)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 401) {
      this.clearAccessToken();
      throw new Error('Workspace session expired. Please re-authenticate.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch forms (HTTP ${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Get detailed Form structure and questions
   */
  async getForm(formId: string): Promise<GoogleFormDetail> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required.');
    }

    const url = `https://forms.googleapis.com/v1/forms/${formId}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 401) {
      this.clearAccessToken();
      throw new Error('Workspace session expired. Please re-authenticate.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch form details (HTTP ${res.status})`);
    }

    return await res.json();
  },

  /**
   * Fetch form response submissions
   */
  async getResponses(formId: string): Promise<{ responses: GoogleFormSubmission[]; total: number }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required.');
    }

    const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 401) {
      this.clearAccessToken();
      throw new Error('Workspace session expired. Please re-authenticate.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to fetch form responses (HTTP ${res.status})`);
    }

    const data = await res.json();
    const responses: GoogleFormSubmission[] = data.responses || [];
    return {
      responses,
      total: responses.length
    };
  },

  /**
   * Create a new Google Form with title, description, and initial questions
   */
  async createForm(params: {
    title: string;
    description?: string;
    questions?: GoogleFormQuestionItem[];
  }): Promise<GoogleFormDetail> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required.');
    }

    // 1. Initialize Form
    const createUrl = 'https://forms.googleapis.com/v1/forms';
    const initRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        info: {
          title: params.title.trim(),
          documentTitle: params.title.trim()
        }
      })
    });

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create form (HTTP ${initRes.status})`);
    }

    const createdForm: GoogleFormDetail = await initRes.json();
    const formId = createdForm.formId;

    // 2. Build batchUpdate requests for description and initial questions
    const requests: any[] = [];

    if (params.description && params.description.trim()) {
      requests.push({
        updateFormInfo: {
          info: {
            description: params.description.trim()
          },
          updateMask: 'description'
        }
      });
    }

    if (params.questions && params.questions.length > 0) {
      params.questions.forEach((q, index) => {
        const item: any = {
          title: q.title,
          description: q.description || '',
          questionItem: {
            question: {
              required: Boolean(q.required)
            }
          }
        };

        if (q.type === 'TEXT') {
          item.questionItem.question.textQuestion = { paragraph: false };
        } else if (q.type === 'PARAGRAPH_TEXT') {
          item.questionItem.question.textQuestion = { paragraph: true };
        } else if (q.type === 'RADIO' || q.type === 'CHECKBOX' || q.type === 'DROP_DOWN') {
          item.questionItem.question.choiceQuestion = {
            type: q.type,
            options: (q.options && q.options.length > 0 ? q.options : [{ value: 'Option 1' }]).map((o) => ({
              value: o.value
            }))
          };
        } else if (q.type === 'SCALE') {
          item.questionItem.question.scaleQuestion = {
            low: q.scaleLow || 1,
            high: q.scaleHigh || 5,
            lowLabel: q.scaleLowLabel || 'Poor',
            highLabel: q.scaleHighLabel || 'Excellent'
          };
        }

        requests.push({
          createItem: {
            item,
            location: {
              index
            }
          }
        });
      });
    }

    if (requests.length > 0) {
      const batchUrl = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;
      const batchRes = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!batchRes.ok) {
        console.warn('Batch update encountered an issue, form was initialized:', await batchRes.text());
      }
    }

    // Return the updated form detail
    return await this.getForm(formId);
  },

  /**
   * Add a question to an existing form
   */
  async addQuestion(formId: string, question: GoogleFormQuestionItem, index: number = 0): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required.');
    }

    const item: any = {
      title: question.title,
      description: question.description || '',
      questionItem: {
        question: {
          required: Boolean(question.required)
        }
      }
    };

    if (question.type === 'TEXT') {
      item.questionItem.question.textQuestion = { paragraph: false };
    } else if (question.type === 'PARAGRAPH_TEXT') {
      item.questionItem.question.textQuestion = { paragraph: true };
    } else if (question.type === 'RADIO' || question.type === 'CHECKBOX' || question.type === 'DROP_DOWN') {
      item.questionItem.question.choiceQuestion = {
        type: question.type,
        options: (question.options && question.options.length > 0 ? question.options : [{ value: 'Option 1' }]).map((o) => ({
          value: o.value
        }))
      };
    } else if (question.type === 'SCALE') {
      item.questionItem.question.scaleQuestion = {
        low: question.scaleLow || 1,
        high: question.scaleHigh || 5,
        lowLabel: question.scaleLowLabel || 'Poor',
        highLabel: question.scaleHighLabel || 'Excellent'
      };
    }

    const batchUrl = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;
    const res = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              item,
              location: { index }
            }
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to add question (HTTP ${res.status})`);
    }
  },

  /**
   * Delete / Trash a Google Form file in Google Drive
   * (MUST be called ONLY after explicit user confirmation in UI)
   */
  async deleteForm(fileId: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Google Workspace authentication required.');
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete form (HTTP ${res.status})`);
    }
  }
};
