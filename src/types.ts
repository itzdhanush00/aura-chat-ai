export interface ImageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 string without data: prefix
  previewUrl: string; // full data URL for preview
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingSource[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: ImageAttachment[];
  timestamp: number;
  grounding?: GroundingMetadata;
  isStreaming?: boolean;
  error?: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  temperature: number;
  badgeColor: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  personaId: string;
  enableSearch: boolean;
}

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type SpeedMode = 'ultra-fast' | 'balanced' | 'deep';

export interface AppSettings {
  soundEnabled: boolean;
  voice: VoiceName;
  theme: 'dark' | 'midnight' | 'light';
  autoSpeak: boolean;
  speedMode: SpeedMode;
}

