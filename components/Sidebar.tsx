
import React from 'react';
import { SavedChat } from '../types';
import { IconSaturn, IconPlus, IconMessage, IconTrash, IconX, IconSettings } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chats: SavedChat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  chats, 
  currentChatId, 
  onSelectChat, 
  onDeleteChat,
  onOpenSettings
}) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
           <div className="flex items-center gap-2 text-textMain font-medium">
             <IconSaturn className="w-5 h-5 text-primary" />
             <span>Vortex</span>
           </div>
           <button onClick={onClose} className="md:hidden text-secondary hover:text-textMain">
             <IconX className="w-5 h-5" />
           </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <button 
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-highlight text-textMain py-2.5 rounded-lg border border-border transition-colors font-medium text-sm mb-6"
          >
            <IconPlus className="w-4 h-4" />
            New Thread
          </button>

          <div className="space-y-1">
            {chats.length === 0 ? (
              <div className="text-sm text-secondary/50 px-2 italic text-center">No history yet</div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 768) onClose();
                  }}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm
                    ${currentChatId === chat.id ? 'bg-surface text-textMain' : 'text-secondary hover:bg-highlight hover:text-textMain'}
                  `}
                >
                  <IconMessage className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{chat.title}</span>
                  
                  <button 
                    onClick={(e) => onDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                    title="Delete chat"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-border">
           <button 
             onClick={() => {
               onOpenSettings();
               if (window.innerWidth < 768) onClose();
             }}
             className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary hover:text-textMain hover:bg-highlight rounded-lg transition-colors"
           >
             <IconSettings className="w-4 h-4" />
             <span>Settings</span>
           </button>
        </div>
      </div>
    </>
  );
};
