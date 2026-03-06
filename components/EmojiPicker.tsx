'use client';

import { useState, useEffect } from 'react';
import { emojiCategories } from '@/lib/emojiData';
import { useBackButton } from '@/hooks/useBackButton';

interface EmojiPickerProps {
  value: string;
  defaultEmoji: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ value, defaultEmoji, onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  // Android back button closes picker
  useBackButton(true, onClose);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scrolling when picker is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Icon wählen</h3>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                {value || defaultEmoji}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {emojiCategories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                activeCategory === i
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
          <div className="grid grid-cols-7 gap-1">
            {emojiCategories[activeCategory].emojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => onSelect(emoji)}
                className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-colors ${
                  value === emoji
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
