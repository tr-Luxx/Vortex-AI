
export interface GroundingSource {
  title: string;
  uri: string;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: GroundingSource[];
  isStreaming?: boolean;
  image?: string;
}

export interface ChatSession {
  history: Message[];
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserSettings {
  model: 'gemini-2.5-flash' | 'gemini-3-pro-preview';
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  autoSendVoice: boolean;
  theme: 'light' | 'dark';
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  instruction: string;
  color: string;
  isDefault: boolean;
}
