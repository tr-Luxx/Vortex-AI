
import React, { useState, useEffect } from 'react';
import { Partner } from '../types';
import { IconX } from './Icons';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partner: Partner) => void;
  editingPartner: Partner | null;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPartner
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [color, setColor] = useState('#2bb0ba');

  useEffect(() => {
    if (editingPartner) {
      setName(editingPartner.name);
      setDescription(editingPartner.description);
      setInstruction(editingPartner.instruction);
      setColor(editingPartner.color);
    } else {
      // Defaults
      setName('');
      setDescription('');
      setInstruction('');
      setColor('#2bb0ba');
    }
  }, [editingPartner, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPartner: Partner = {
      id: editingPartner ? editingPartner.id : Date.now().toString(),
      name,
      description,
      instruction,
      color,
      isDefault: false
    };
    onSave(newPartner);
    onClose();
  };

  const colors = ['#2bb0ba', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium text-textMain">{editingPartner ? 'Edit Partner' : 'Add Partner'}</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-textMain transition-colors p-1 rounded"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-secondary uppercase">Partner Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coding Assistant"
              className="w-full bg-highlight border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-secondary uppercase">Description</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief role description..."
              className="w-full bg-highlight border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-secondary uppercase">Personality / Instructions</label>
            <textarea 
              required
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="How should this partner behave? (e.g., 'You are an expert in biology...')"
              rows={4}
              className="w-full bg-highlight border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-secondary uppercase">Theme Color</label>
            <div className="flex gap-3 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-primary hover:bg-[#4cd4df] text-[#0f0f12] font-medium py-2.5 rounded-lg transition-colors"
            >
              {editingPartner ? 'Save Changes' : 'Create Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
