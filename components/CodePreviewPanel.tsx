
import React, { useState, useEffect } from 'react';
import { IconX, IconMaximize, IconMinimize, IconPlay, IconCode, IconCheck, IconCopy } from './Icons';

interface CodePreviewPanelProps {
  code: string;
  language: string;
  onClose: () => void;
}

export const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({ code, language, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');

  // Determine if we can preview this language
  const canPreview = ['html', 'svg', 'xml'].includes(language.toLowerCase());

  useEffect(() => {
    if (canPreview) {
      // Simple wrap for HTML preview
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { color: #000; font-family: sans-serif; background: transparent; margin: 0; padding: 1rem; }
              @media (prefers-color-scheme: dark) {
                 body { color: #fff; }
              }
            </style>
          </head>
          <body>${code}</body>
        </html>
      `;
      setSrcDoc(content);
      setActiveTab('preview');
    } else {
      setActiveTab('code');
    }
  }, [code, language, canPreview]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className={`
        flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out
        ${isFullscreen ? 'fixed inset-0 z-50 w-full h-full' : 'w-full md:w-1/2 h-full relative'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-textMain flex items-center gap-2">
            <IconCode className="w-4 h-4 text-primary" />
            Workbench
          </span>
          
          {/* Tabs */}
          <div className="flex bg-highlight rounded-lg p-0.5 ml-4">
            {canPreview && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-background text-textMain shadow' : 'text-secondary hover:text-textMain'}`}
              >
                Preview
              </button>
            )}
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'code' ? 'bg-background text-textMain shadow' : 'text-secondary hover:text-textMain'}`}
            >
              Code
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy}
            className="p-1.5 text-secondary hover:text-textMain hover:bg-highlight rounded transition-colors"
            title="Copy Code"
          >
             {isCopied ? <IconCheck className="w-4 h-4 text-green-400" /> : <IconCopy className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-secondary hover:text-textMain hover:bg-highlight rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IconMinimize className="w-4 h-4" /> : <IconMaximize className="w-4 h-4" />}
          </button>

          <button 
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-textMain hover:bg-highlight rounded transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-background">
        {activeTab === 'preview' && canPreview ? (
          <iframe 
            srcDoc={srcDoc}
            title="Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="w-full h-full p-4 overflow-auto text-sm font-mono text-textMain leading-relaxed bg-surface">
            <code>{code}</code>
          </pre>
        )}

        {/* Run/Update Badge (Visual only as we update instantly) */}
        {activeTab === 'preview' && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur text-xs text-white px-3 py-1.5 rounded-full border border-white/10">
            <IconPlay className="w-3 h-3 text-green-400" />
            <span>Live Preview</span>
          </div>
        )}
      </div>
    </div>
  );
};
