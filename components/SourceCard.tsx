
import React from 'react';
import { GroundingSource } from '../types';
import { IconGlobe } from './Icons';

interface SourceCardProps {
  source: GroundingSource;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  // Parse domain for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'web';
    }
  };

  return (
    <a 
      href={source.uri} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex-shrink-0 w-40 h-28 bg-surface border border-border rounded-lg p-3 hover:bg-highlight hover:border-primary/30 transition-all duration-200 group flex flex-col justify-between cursor-pointer no-underline"
    >
      <div className="text-xs text-secondary group-hover:text-primary/80 transition-colors truncate mb-1">
        {getDomain(source.uri)}
      </div>
      <div className="text-sm font-medium text-textMain line-clamp-2 leading-tight mb-2">
        {source.title}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-secondary">
        <div className="w-4 h-4 rounded-full bg-highlight group-hover:bg-surface flex items-center justify-center">
           <IconGlobe className="w-2.5 h-2.5" />
        </div>
        <span>{index + 1}</span>
      </div>
    </a>
  );
};
