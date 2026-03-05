'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Item } from '@/lib/types';
import { getItemIcon, getCategoryColor, categories } from '@/lib/itemIcons';
import { EmojiPicker } from '@/components/EmojiPicker';

export default function ZutatenPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIcon, setEditIcon] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Group filtered items by category
  const grouped = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'Sonstiges';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const categoryOrder = categories;
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const startEditing = (item: Item) => {
    setEditingId(item.id);
    setEditIcon(item.icon || '');
    setPickerOpen(true);
  };

  const saveIcon = async (itemId: string) => {
    const newIcon = editIcon.trim() || null;
    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, icon: newIcon } : i
    ));
    setEditingId(null);
    setEditIcon('');
    setPickerOpen(false);
    await supabase.from('items').update({ icon: newIcon }).eq('id', itemId);
  };

  const resetIcon = async (itemId: string) => {
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, icon: null } : i
    ));
    setEditingId(null);
    setEditIcon('');
    setPickerOpen(false);
    await supabase.from('items').update({ icon: null }).eq('id', itemId);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditIcon('');
    setPickerOpen(false);
  };

  const editingItem = editingId ? items.find(i => i.id === editingId) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Zutaten</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {searchQuery.trim() && filteredItems.length !== items.length
            ? `${filteredItems.length} von ${items.length}`
            : items.length} Artikel
        </span>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            placeholder="Zutat suchen..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🥕</p>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery ? 'Keine Zutaten gefunden' : 'Noch keine Zutaten vorhanden'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map(category => (
            <div key={category}>
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                {category}
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {grouped[category].map(item => {
                  const isEditing = editingId === item.id;
                  const currentIcon = getItemIcon(item.name, item.icon);
                  const hasCustomIcon = !!item.icon;

                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => setPickerOpen(true)}
                            className="w-12 h-10 text-center text-2xl rounded-xl border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          >
                            {editIcon || getItemIcon(item.name)}
                          </button>
                          <span className="flex-1 text-sm font-medium min-w-0 truncate">{item.name}</span>
                          <button
                            onClick={() => saveIcon(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            OK
                          </button>
                          {hasCustomIcon && (
                            <button
                              onClick={() => resetIcon(item.id)}
                              className="px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Zurücksetzen"
                            >
                              ↺
                            </button>
                          )}
                          <button
                            onClick={cancelEditing}
                            className="px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                            {currentIcon}
                          </div>
                          <span className="flex-1 text-sm font-medium min-w-0 truncate">{item.name}</span>
                          {hasCustomIcon && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                              Eigenes Icon
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${getCategoryColor(item.category)}`}>
                            {item.category || 'Sonstiges'}
                          </span>
                          <button
                            onClick={() => startEditing(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex-shrink-0"
                            title="Icon ändern"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {pickerOpen && editingItem && (
        <EmojiPicker
          value={editIcon}
          defaultEmoji={getItemIcon(editingItem.name)}
          onSelect={(emoji) => {
            setEditIcon(emoji);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
