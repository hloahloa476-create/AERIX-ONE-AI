export type NavigationTab = 'home' | 'ai' | 'maps' | 'shorts' | 'apps';

export type AppId = 
  | 'games' 
  | 'mail' 
  | 'calls' 
  | 'files' 
  | 'camera' 
  | 'music' 
  | 'notes' 
  | 'browser' 
  | 'settings'
  | 'slides'
  | 'forms'
  | 'aerix_image'
  | 'aerix_video'
  | 'smart_kitchen'
  | 'aerix_voice'
  | 'aerix_write'
  | 'aerix_enhance'
  | 'aerix_remove'
  | 'aerix_tools';

export interface AerixNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'system' | 'ai' | 'security' | 'comm';
}

export interface ChatMessageAttachment {
  name: string;
  type: 'image' | 'file';
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
}

export interface ChatCommandAction {
  type: 'open_app' | 'navigate';
  target: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: ChatMessageAttachment[];
  isError?: boolean;
  commandAction?: ChatCommandAction;
  model?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  model?: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface GeneratedShort {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  style: 'Cinematic' | 'Realistic' | 'Anime' | '3D' | 'Horror' | 'Action' | 'Fantasy' | 'Comedy';
  duration: 5 | 10 | 15 | 30;
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality: 'HD' | '4K';
  cameraStyle: 'Handheld' | 'Cinematic' | 'Drone' | 'Close-up' | 'Tracking Shot' | 'Slow Motion';
  lighting: 'Natural' | 'Dark' | 'Neon' | 'Studio' | 'Sunset';
  music: string;
  speed: number;
  textOverlay?: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  fileSize?: string;
}

export interface ShortVideo {
  id: string;
  title?: string;
  creator: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
    followers: string;
    bio: string;
  };
  description: string;
  tags: string[];
  audioTitle: string;
  musicArtist?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views?: number;
  createdAt?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  videoType: 'neon-city' | 'orbital-station' | 'quantum-ai' | 'speed-racer' | 'hyper-loop' | 'custom';
}

export interface ShortComment {
  id: string;
  shortId: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes?: number;
  isLiked?: boolean;
}

export interface MailMessage {
  id: string;
  sender: string;
  email: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  unread: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
}

export interface CallRecord {
  id: string;
  name: string;
  number: string;
  type: 'incoming' | 'outgoing' | 'missed';
  time: string;
  duration: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  number: string;
  avatar: string;
  favorite: boolean;
}

export interface UserFile {
  id: string;
  name: string;
  category: 'image' | 'video' | 'document' | 'audio' | 'download';
  size: string;
  updatedAt: string;
  previewUrl?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  bpm: number;
  genre: string;
  frequencies: number[]; // For synth playback
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned: boolean;
  folder: string;
  color?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favIcon?: string;
  history: string[];
}

export interface GoogleSlidePresentationSummary {
  id: string;
  title: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface GoogleSlidePresentationDetail {
  presentationId: string;
  title: string;
  slides?: Array<{
    objectId: string;
    pageElements?: Array<{
      objectId: string;
      shape?: {
        shapeType: string;
        text?: {
          textElements?: Array<{
            textRun?: {
              content: string;
            };
          }>;
        };
      };
    }>;
  }>;
  pageSize?: {
    width?: { magnitude: number; unit: string };
    height?: { magnitude: number; unit: string };
  };
}
