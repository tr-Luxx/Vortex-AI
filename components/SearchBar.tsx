
import React, { useState, useRef, useEffect } from 'react';
import { IconSearch, IconArrowRight, IconStop, IconMic, IconCopy, IconCheck } from './Icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  centered?: boolean;
  className?: string;
  autoSend?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isSearching, 
  placeholder = "Ask anything...", 
  autoFocus = false,
  centered = false,
  className = "",
  autoSend = false
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stops after one sentence
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          
          // Get current value from ref to avoid stale closures if user typed before speaking
          const currentVal = textareaRef.current?.value || '';
          const newText = currentVal ? `${currentVal.trim()} ${transcript}` : transcript;
          
          setQuery(newText);
          setIsListening(false);

          if (autoSend && newText.trim()) {
              // Dispatch search immediately
              onSearch(newText);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [autoSend, onSearch]); // Re-initialize if autoSend setting changes

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleCopy = () => {
      if (query) {
          navigator.clipboard.writeText(query);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isSearching) {
        onSearch(query);
        setQuery('');
      }
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className={`relative group w-full max-w-3xl mx-auto ${className}`}>
      <div className={`
        relative flex items-end gap-2 bg-surface border rounded-2xl p-3 transition-all duration-300 shadow-lg
        ${centered ? 'border-border hover:border-highlight shadow-2xl' : 'border-border'}
        ${isSearching ? 'opacity-80 cursor-wait' : ''}
      `}>
        
        <div className="pb-3 pl-2 text-secondary flex-shrink-0">
             {isSearching ? (
                 <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
             ) : (
                 <IconSearch className="w-5 h-5" />
             )}
        </div>

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : placeholder}
          rows={1}
          disabled={isSearching}
          className="flex-1 min-w-0 bg-transparent text-textMain placeholder-secondary resize-none focus:outline-none py-3 max-h-[200px] overflow-y-auto font-medium leading-relaxed"
        />

        <div className="flex items-end gap-2 mb-1 flex-shrink-0">
            {/* Mic Button */}
            <button
                onClick={toggleListening}
                className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isListening 
                        ? 'bg-red-500/10 text-red-500 animate-pulse' 
                        : 'text-secondary hover:text-textMain hover:bg-highlight'}
                    ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={isSearching}
                title={autoSend ? "Voice Search (Auto-send on)" : "Voice Search"}
            >
                <IconMic className="w-5 h-5" />
            </button>

             {/* Copy Button */}
             {hasQuery && (
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-secondary hover:text-textMain hover:bg-highlight transition-all duration-200"
                    title="Copy Text"
                >
                    {isCopied ? <IconCheck className="w-5 h-5 text-green-400" /> : <IconCopy className="w-5 h-5" />}
                </button>
            )}

            {/* Submit Button */}
            <button
              onClick={() => hasQuery && !isSearching && onSearch(query)}
              disabled={!hasQuery || isSearching}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${hasQuery && !isSearching
                  ? 'bg-primary text-[#0f0f12] hover:bg-[#4cd4df] shadow-[0_0_10px_rgba(43,176,186,0.3)]' 
                  : 'text-secondary bg-transparent cursor-not-allowed opacity-50'}
              `}
            >
               {isSearching ? (
                   <IconStop className="w-5 h-5" />
               ) : (
                   <IconArrowRight className="w-5 h-5" />
               )}
            </button>
        </div>
      </div>
      
      {centered && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4 text-xs text-secondary font-mono opacity-60">
          <span>Focus</span>
          <span>Attach</span>
          <span>Pro</span>
        </div>
      )}
    </div>
  );
};
