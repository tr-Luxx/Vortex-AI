
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, SavedChat, UserSettings } from './types';
import { createSearchChat, streamMessage, generateImage } from './services/gemini';
import { getSavedChats, saveChat, deleteChat as deleteSavedChat, getSettings, saveSettings, clearAllChats } from './services/storage';
import { SearchBar } from './components/SearchBar';
import { MessageItem } from './components/MessageItem';
import { IconPlus, IconWaveform, IconMenu, IconSaturn } from './components/Icons';
import { LiveOverlay } from './components/LiveOverlay';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { CodePreviewPanel } from './components/CodePreviewPanel';
import { Chat } from '@google/genai';

// Suggestion chips for the empty state
const SUGGESTIONS = [
  "Latest developments in quantum computing",
  "Image of a futuristic city on Mars",
  "History of the Roman Empire",
  "Draw a cute robot holding a flower"
];

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings State
  const [settings, setSettingsState] = useState<UserSettings>(getSettings());

  // History State
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Code Preview State
  const [previewCode, setPreviewCode] = useState<{code: string, language: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize on load
  useEffect(() => {
    setSavedChats(getSavedChats());
    initializeChat();
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleSaveSettings = (newSettings: UserSettings) => {
    saveSettings(newSettings);
    setSettingsState(newSettings);
    // Re-init chat if model changed
    initializeChat(messages);
  };

  const handleClearHistory = () => {
    clearAllChats();
    setSavedChats([]);
    handleNewThread();
    setIsSettingsOpen(false);
  };

  // Initialize chat session (internal helper)
  const initializeChat = (history: Message[] = []) => {
    const session = createSearchChat(history, settings.model);
    setChatSession(session);
    return session;
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!previewCode) { // Only auto-scroll if user isn't focused on code panel
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, previewCode]);

  // Auto-save chat when messages update
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      const chatToSave: SavedChat = {
        id: currentChatId,
        title: messages[0]?.content || 'New Chat',
        messages: messages,
        createdAt: Date.now()
      };
      
      const existing = savedChats.find(c => c.id === currentChatId);
      if (existing) {
        chatToSave.createdAt = existing.createdAt;
        chatToSave.title = existing.title;
      } else {
         chatToSave.title = messages[0].content.length > 30 
            ? messages[0].content.substring(0, 30) + '...' 
            : messages[0].content;
      }

      saveChat(chatToSave);
      setSavedChats(getSavedChats());
    }
  }, [messages, currentChatId]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    let effectiveChatId = currentChatId;
    if (!effectiveChatId) {
        effectiveChatId = Date.now().toString();
        setCurrentChatId(effectiveChatId);
    }
    
    // Always ensure session matches current settings if starting fresh or if it's null
    let currentSession = chatSession;
    if (!currentSession || messages.length === 0) {
       currentSession = initializeChat(messages);
    }

    // Add User Message
    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: MessageRole.USER,
      content: query
    };

    // Placeholder AI Message
    const aiMsgId = (Date.now() + 1).toString();
    const newAiMsg: Message = {
      id: aiMsgId,
      role: MessageRole.MODEL,
      content: '',
      isStreaming: true,
      sources: []
    };

    setMessages(prev => [...prev, newUserMsg, newAiMsg]);

    // Check for image generation intent
    const imageKeywords = /^(draw|paint|generate|create|make) (an )?image|image of/i;
    const isImageRequest = imageKeywords.test(query);

    if (isImageRequest) {
        const imageData = await generateImage(query);
        
        setMessages(prev => prev.map(msg => {
            if (msg.id === aiMsgId) {
                return {
                    ...msg,
                    isStreaming: false,
                    content: imageData ? "Here is the image I generated for you." : "I'm sorry, I couldn't generate that image right now.",
                    image: imageData || undefined
                };
            }
            return msg;
        }));
    } else {
        await streamMessage(
            currentSession,
            query,
            (chunk) => {
                setMessages(prev => {
                return prev.map(msg => {
                    if (msg.id === aiMsgId) {
                    const currentSources = msg.sources || [];
                    const newSources = chunk.sources || [];
                    
                    const combinedSources = [...currentSources];
                    newSources.forEach(ns => {
                        if (!combinedSources.find(cs => cs.uri === ns.uri)) {
                            combinedSources.push(ns);
                        }
                    });

                    return {
                        ...msg,
                        content: msg.content + chunk.text,
                        sources: combinedSources
                    };
                    }
                    return msg;
                });
                });
            }
        );
        
        setMessages(prev => prev.map(msg => {
            if (msg.id === aiMsgId) {
                return { ...msg, isStreaming: false };
            }
            return msg;
        }));
    }

    setIsSearching(false);
  };

  const handleRegenerate = (aiMsgId: string) => {
    if (isSearching) return;

    const msgIndex = messages.findIndex(m => m.id === aiMsgId);
    if (msgIndex === -1) return;

    // Find the user message immediately preceding this AI message
    const userMsg = messages[msgIndex - 1];
    if (!userMsg || userMsg.role !== MessageRole.USER) return;

    // Keep messages up to the user message, removing the AI message and anything after
    const newHistory = messages.slice(0, msgIndex - 1);
    setMessages(newHistory);
    
    // Reset chat session to this point
    initializeChat(newHistory);

    // Trigger search again with the user's last query
    handleSearch(userMsg.content);
  };

  const handleSimplify = (content: string) => {
    if (isSearching) return;
    handleSearch(`Explain the following text in simple terms:\n\n${content}`);
  };

  const handleNewThread = () => {
    setMessages([]);
    setCurrentChatId(null);
    setPreviewCode(null);
    initializeChat([]); 
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
        setMessages(chat.messages);
        setCurrentChatId(chat.id);
        setPreviewCode(null);
        initializeChat(chat.messages); 
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = deleteSavedChat(chatId);
      setSavedChats(updated);
      if (currentChatId === chatId) {
          handleNewThread();
      }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden transition-colors duration-300">
        
        {/* Live Mode Overlay */}
        {isLiveMode && <LiveOverlay onClose={() => setIsLiveMode(false)} voiceName={settings.voice} />}

        {/* Settings Modal */}
        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSave={handleSaveSettings}
            onClearHistory={handleClearHistory}
        />

        {/* Sidebar */}
        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onNewChat={handleNewThread}
            chats={savedChats}
            currentChatId={currentChatId}
            onSelectChat={loadChat}
            onDeleteChat={handleDeleteChat}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Code Preview Panel */}
        {previewCode && (
           <div className={`
             hidden md:flex transition-all duration-300 ease-in-out border-r border-border z-20
             ${isSidebarOpen ? 'ml-72' : 'ml-0'}
             w-1/2
           `}>
              <CodePreviewPanel 
                code={previewCode.code} 
                language={previewCode.language} 
                onClose={() => setPreviewCode(null)} 
              />
           </div>
        )}

        {/* Main Content Area */}
        <div className={`
            flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
            ${isSidebarOpen && !previewCode ? 'md:ml-72' : 'ml-0'} 
        `}>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-secondary hover:text-textMain hover:bg-highlight rounded-lg transition-colors"
                        >
                            <IconMenu className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <IconSaturn className="w-6 h-6 text-textMain" />
                            <span className="text-lg font-medium text-textMain font-serif tracking-tight">Vortex</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLiveMode(true)}
                            className="flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
                            title="Start Live Mode"
                        >
                            <IconWaveform className="w-5 h-5" />
                            <span className="hidden sm:inline">Live</span>
                        </button>

                        <div className="h-5 w-px bg-border mx-1" />

                        <button 
                            onClick={handleNewThread}
                            className="flex items-center gap-2 text-sm font-medium bg-primary text-[#0f0f12] hover:bg-[#4cd4df] px-4 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(43,176,186,0.2)] hover:shadow-[0_0_20px_rgba(43,176,186,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <IconPlus className="w-4 h-4" />
                            <span>New Chat</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            {messages.length === 0 ? (
                // Home View
                <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-3xl flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-textMain tracking-tight text-center">
                            Where knowledge begins
                        </h1>
                    </div>

                    <SearchBar 
                        onSearch={handleSearch} 
                        isSearching={isSearching} 
                        autoFocus={true}
                        centered={true}
                        placeholder="Ask Vortex anything..."
                        autoSend={settings.autoSendVoice}
                    />

                    <div className="flex flex-wrap justify-center gap-3 mt-4 max-w-2xl">
                        {SUGGESTIONS.map((text, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSearch(text)}
                            className="text-sm text-secondary hover:text-textMain bg-surface/50 hover:bg-surface border border-border px-4 py-2 rounded-full transition-all duration-200"
                        >
                            {text}
                        </button>
                        ))}
                    </div>
                    </div>
                </div>
            ) : (
                // Thread View
                <>
                    <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-32 pt-6">
                        {messages.map(msg => (
                            <MessageItem 
                                key={msg.id} 
                                message={msg} 
                                onRegenerate={handleRegenerate} 
                                onOpenPreview={(code, lang) => setPreviewCode({code, language: lang})}
                                onSimplify={handleSimplify}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </main>

                    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4 z-20 pointer-events-none">
                        <div className={`max-w-3xl mx-auto pointer-events-auto transition-all duration-300 ${isSidebarOpen && !previewCode ? 'md:ml-[18rem]' : ''}`}>
                            <SearchBar 
                                onSearch={handleSearch} 
                                isSearching={isSearching} 
                                placeholder="Ask a follow up..."
                                className="shadow-xl"
                                autoSend={settings.autoSendVoice}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default App;
