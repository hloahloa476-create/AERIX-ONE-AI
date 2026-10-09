/**
 * AERIX ONE - Google Slides Service Integration (Google Workspace)
 * Client-side OAuth token retrieval via Firebase Auth & direct REST calls
 * to Google Slides API (v1) and Google Drive API (v3).
 * Access token kept in memory only.
 */

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { GoogleSlidePresentationSummary, GoogleSlidePresentationDetail } from '../types';

export const SLIDES_SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

let cachedSlidesToken: string | null = null;
let cachedSlidesUserEmail: string | null = null;
let cachedSlidesUserName: string | null = null;

// Clear cached token if user signs out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedSlidesToken = null;
    cachedSlidesUserEmail = null;
    cachedSlidesUserName = null;
  }
});

export const slidesService = {
  phase: 'Phase 5 - Live Google Slides Workspace Integration',

  isConnected(): boolean {
    return Boolean(cachedSlidesToken);
  },

  getConnectedEmail(): string | null {
    return cachedSlidesUserEmail || auth.currentUser?.email || null;
  },

  getConnectedName(): string | null {
    return cachedSlidesUserName || auth.currentUser?.displayName || 'AERIX Creator';
  },

  async getAccessToken(): Promise<string | null> {
    return cachedSlidesToken;
  },

  /**
   * Connect to Google Slides via Firebase Auth GoogleAuthProvider
   */
  async connectSlides(): Promise<string> {
    const provider = new GoogleAuthProvider();
    SLIDES_SCOPES.forEach((scope) => provider.addScope(scope));

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Failed to obtain Google Slides access token from Google Auth.');
      }

      cachedSlidesToken = credential.accessToken;
      cachedSlidesUserEmail = result.user.email;
      cachedSlidesUserName = result.user.displayName || result.user.email?.split('@')[0] || 'User';
      return cachedSlidesToken;
    } catch (err: any) {
      console.error('Google Slides OAuth connection failed:', err);
      throw err;
    }
  },

  disconnectSlides() {
    cachedSlidesToken = null;
    cachedSlidesUserEmail = null;
    cachedSlidesUserName = null;
  },

  /**
   * List Google Slides presentations from Google Drive
   */
  async listPresentations(): Promise<GoogleSlidePresentationSummary[]> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected. Please authenticate with Google first.');
    }

    const query = "mimeType='application/vnd.google-apps.presentation' and trashed=false";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,modifiedTime,thumbnailLink,webViewLink,iconLink)`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cachedSlidesToken}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedSlidesToken = null;
        throw new Error('Google Slides session expired. Please reconnect.');
      }
      throw new Error(`Failed to list presentations: ${res.statusText}`);
    }

    const data = await res.json();
    const files = data.files || [];

    return files.map((f: any) => ({
      id: f.id,
      title: f.name || 'Untitled Presentation',
      modifiedTime: f.modifiedTime,
      thumbnailLink: f.thumbnailLink,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink
    }));
  },

  /**
   * Get single presentation details from Google Slides API
   */
  async getPresentation(presentationId: string): Promise<GoogleSlidePresentationDetail> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected. Please authenticate with Google first.');
    }

    const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: {
        Authorization: `Bearer ${cachedSlidesToken}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedSlidesToken = null;
        throw new Error('Google Slides session expired. Please reconnect.');
      }
      throw new Error(`Failed to get presentation: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Create a new blank Google Slides presentation
   */
  async createPresentation(title: string): Promise<GoogleSlidePresentationDetail> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected. Please authenticate with Google first.');
    }

    const res = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedSlidesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title || 'AERIX Deck'
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to create presentation: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Add a slide with title and body text to an existing presentation
   */
  async addSlide(
    presentationId: string,
    slideTitle: string,
    slideBody: string
  ): Promise<any> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected.');
    }

    const slideId = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const titleBoxId = `title_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bodyBoxId = `body_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const requests: any[] = [
      {
        createSlide: {
          objectId: slideId,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          }
        }
      }
    ];

    // If custom title/body provided, add shapes with text
    if (slideTitle || slideBody) {
      requests.push(
        {
          createShape: {
            objectId: titleBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 50, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 50,
                translateY: 40,
                unit: 'PT'
              }
            }
          }
        },
        {
          insertText: {
            objectId: titleBoxId,
            insertionIndex: 0,
            text: slideTitle || 'New Slide'
          }
        }
      );

      if (slideBody) {
        requests.push(
          {
            createShape: {
              objectId: bodyBoxId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: 600, unit: 'PT' },
                  height: { magnitude: 250, unit: 'PT' }
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: 50,
                  translateY: 110,
                  unit: 'PT'
                }
              }
            }
          },
          {
            insertText: {
              objectId: bodyBoxId,
              insertionIndex: 0,
              text: slideBody
            }
          }
        );
      }
    }

    const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedSlidesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!res.ok) {
      throw new Error(`Failed to add slide: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete a presentation from Google Drive (Requires explicit UI confirmation!)
   */
  async deletePresentation(presentationId: string): Promise<boolean> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected.');
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${presentationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cachedSlidesToken}`
      }
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete presentation: ${res.statusText}`);
    }

    return true;
  },

  /**
   * AI Deck Generator: Generates a complete presentation deck on a topic
   */
  async generateAiDeck(topic: string, theme: string = 'Cinematic AI'): Promise<GoogleSlidePresentationDetail> {
    if (!cachedSlidesToken) {
      throw new Error('Google Slides is not connected.');
    }

    // Step 1: Create the presentation
    const title = `${topic.slice(0, 40)} - AERIX Deck`;
    const presentation = await this.createPresentation(title);
    const presId = presentation.presentationId;

    // Step 2: Add 3 structured slides with content
    const slidesData = [
      {
        title: `1. Executive Overview: ${topic}`,
        body: `• Vision: Transforming ${topic} using next-generation intelligent workflows.\n• Core Focus: Unified experience, high-performance automation, and instant deployment.\n• Target Impact: 10x operational velocity with AERIX ONE integration.`
      },
      {
        title: `2. Key Capabilities & Architecture`,
        body: `• Deep Neural Core: Real-time analysis and context retention.\n• Cloud Integration: Synchronized with Google Workspace and Cloud databases.\n• Adaptive Interface: Seamless mobile and desktop ergonomics.`
      },
      {
        title: `3. Strategic Roadmap & Next Milestones`,
        body: `• Q1: Global roll-out & live workspace connectivity.\n• Q2: Autonomous edge agent orchestration.\n• Q3: Universal interoperability across all AERIX nodes.`
      }
    ];

    for (const slide of slidesData) {
      try {
        await this.addSlide(presId, slide.title, slide.body);
      } catch (err) {
        console.warn('Error appending slide:', err);
      }
    }

    return await this.getPresentation(presId);
  }
};
