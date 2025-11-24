
import { SavedChat, UserSettings } from '../types';

const STORAGE_KEY = 'vortex_chats';
const SETTINGS_KEY = 'vortex_settings';

/* --- CHAT HISTORY --- */

export const getSavedChats = (): SavedChat[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load chats", e);
    return [];
  }
};

export const saveChat = (chat: SavedChat): void => {
  const chats = getSavedChats();
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  
  if (existingIndex >= 0) {
    chats[existingIndex] = chat;
  } else {
    chats.unshift(chat);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
};

export const deleteChat = (chatId: string): SavedChat[] => {
  const chats = getSavedChats().filter(c => c.id !== chatId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  return chats;
};

export const clearAllChats = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/* --- SETTINGS --- */

const DEFAULT_SETTINGS: UserSettings = {
  model: 'gemini-2.5-flash',
  voice: 'Zephyr',
  autoSendVoice: false,
  theme: 'dark'
};

export const getSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
