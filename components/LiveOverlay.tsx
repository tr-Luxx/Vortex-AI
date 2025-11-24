import React, { useEffect, useState, useRef } from 'react';
import { IconX, IconStop } from './Icons';
import { GeminiLiveClient } from '../services/gemini';

interface LiveOverlayProps {
  onClose: () => void;
  voiceName: string;
}

export const LiveOverlay: React.FC<LiveOverlayProps> = ({ onClose, voiceName }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const clientRef = useRef<GeminiLiveClient | null>(null);

  useEffect(() => {
    const client = new GeminiLiveClient((vol) => {
      // Smooth out volume for animation
      setVolume(v => v * 0.8 + vol * 0.2);
    });
    clientRef.current = client;

    client.connect(voiceName)
      .then(() => setStatus('connected'))
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });

    return () => {
      client.disconnect();
    };
  }, [voiceName]);

  const scale = Math.min(1 + volume * 5, 2); // Scale orb based on volume

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-full text-gray-300 transition-colors"
      >
        <IconX className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center gap-12">
        <div className="relative">
            {/* Outer Glow */}
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl transition-transform duration-100"
                style={{ transform: `translate(-50%, -50%) scale(${scale * 1.2})` }}
            />
            
            {/* Main Orb */}
            <div 
                className="w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-full shadow-[0_0_60px_rgba(43,176,186,0.5)] transition-transform duration-75 relative z-10"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
            </div>
        </div>

        <div className="text-center space-y-2">
            <h2 className="text-2xl font-medium text-white tracking-wide">
                {status === 'connecting' ? 'Connecting...' : 'Vortex Live'}
            </h2>
            <p className="text-secondary text-sm">
                {status === 'connected' ? 'Listening... Speak to interrupt' : 'Establishing secure connection'}
            </p>
        </div>
      </div>

      {/* Controls */}
      {status === 'connected' && (
        <div className="absolute bottom-12 flex items-center gap-4">
            <button
                onClick={() => clientRef.current?.interrupt()}
                className="p-4 bg-[#27272a] hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all text-gray-300 group border border-transparent hover:border-red-500/30"
                title="Tap to Interrupt"
            >
                <IconStop className="w-6 h-6 group-hover:scale-105 transition-transform" />
            </button>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute bottom-20 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            Connection failed. Please try again.
        </div>
      )}
    </div>
  );
};