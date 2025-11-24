
import React from 'react';
import { UserSettings } from '../types';
import { IconX, IconCpu, IconVolume, IconTrash, IconMic, IconSun, IconMoon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onClearHistory
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium text-textMain">Settings</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-textMain transition-colors p-1 rounded"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <IconSun className="w-4 h-4" />
              <span>Appearance</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSave({ ...settings, theme: 'light' })}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-xl border transition-all
                  ${settings.theme === 'light' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-highlight border-border text-secondary hover:border-primary/50'}
                `}
              >
                <IconSun className="w-4 h-4" />
                <span className="font-medium text-sm">Light</span>
              </button>
              <button
                onClick={() => onSave({ ...settings, theme: 'dark' })}
                className={`
                   flex items-center justify-center gap-2 p-3 rounded-xl border transition-all
                  ${settings.theme === 'dark' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-highlight border-border text-secondary hover:border-primary/50'}
                `}
              >
                <IconMoon className="w-4 h-4" />
                <span className="font-medium text-sm">Dark</span>
              </button>
            </div>
          </div>

          {/* AI Model Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <IconCpu className="w-4 h-4" />
              <span>AI Model</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSave({ ...settings, model: 'gemini-2.5-flash' })}
                className={`
                  p-3 rounded-xl border text-left transition-all
                  ${settings.model === 'gemini-2.5-flash' 
                    ? 'bg-primary/10 border-primary text-textMain' 
                    : 'bg-highlight border-border text-secondary hover:border-primary/50'}
                `}
              >
                <div className="font-medium text-sm mb-1">Balanced</div>
                <div className="text-[10px] opacity-70">Fast & grounded</div>
              </button>
              <button
                onClick={() => onSave({ ...settings, model: 'gemini-3-pro-preview' })}
                className={`
                  p-3 rounded-xl border text-left transition-all
                  ${settings.model === 'gemini-3-pro-preview' 
                    ? 'bg-primary/10 border-primary text-textMain' 
                    : 'bg-highlight border-border text-secondary hover:border-primary/50'}
                `}
              >
                <div className="font-medium text-sm mb-1">Reasoning</div>
                <div className="text-[10px] opacity-70">Gemini 3.0 Pro</div>
              </button>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <IconVolume className="w-4 h-4" />
              <span>Voice & Audio</span>
            </div>
            
            {/* Live Voice Selection */}
            <div className="space-y-2">
                <label className="text-xs text-secondary font-medium ml-1">Live Voice Personality</label>
                <select
                    value={settings.voice}
                    onChange={(e) => onSave({ ...settings, voice: e.target.value as any })}
                    className="w-full bg-highlight border border-border rounded-lg p-2.5 text-sm text-textMain focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                    <option value="Zephyr">Zephyr</option>
                    <option value="Puck">Puck</option>
                    <option value="Charon">Charon</option>
                    <option value="Kore">Kore</option>
                    <option value="Fenrir">Fenrir</option>
                </select>
            </div>

            {/* Auto-Send Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-highlight border border-border">
                <div className="flex items-center gap-2">
                    <IconMic className="w-4 h-4 text-secondary" />
                    <div>
                        <div className="text-sm text-textMain font-medium">Auto-send Voice</div>
                        <div className="text-[10px] text-secondary">Submit search automatically when you stop speaking</div>
                    </div>
                </div>
                <button
                    onClick={() => onSave({ ...settings, autoSendVoice: !settings.autoSendVoice })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${settings.autoSendVoice ? 'bg-primary' : 'bg-secondary'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.autoSendVoice ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Data Settings */}
          <div>
             <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-3">Data & Storage</h3>
             <button 
               onClick={() => {
                   if(confirm('Are you sure you want to delete all chat history?')) {
                       onClearHistory();
                   }
               }}
               className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-red-900/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
             >
                <IconTrash className="w-4 h-4" />
                <span>Clear All Chat History</span>
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};
