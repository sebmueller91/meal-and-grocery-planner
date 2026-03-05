'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingListItem, Item } from '@/lib/types';
import { getItemIcon, getCategoryColor, categories } from '@/lib/itemIcons';

interface RecentEntry {
  item: Item;
  amount: string | null;
  action: 'added' | 'removed';
  timestamp: number;
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<(ShoppingListItem & { items: Item })[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Sonstiges');
  const [showNewForm, setShowNewForm] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('groupByCategory');
    if (stored !== null) setGroupByCategory(JSON.parse(stored));

    const storedRecent = localStorage.getItem('recentEntries');
    if (storedRecent) {
      try {
        const parsed: RecentEntry[] = JSON.parse(storedRecent);
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        setRecentEntries(parsed.filter(e => e.timestamp > cutoff));
      } catch { /* ignore */ }
    }
  }, []);

  const toggleGrouping = () => {
    const next = !groupByCategory;
    setGroupByCategory(next);
    localStorage.setItem('groupByCategory', JSON.stringify(next));
  };

  const addRecentEntry = useCallback((entry: RecentEntry) => {
    setRecentEntries(prev => {
      const updated = [entry, ...prev].slice(0, 30);
      localStorage.setItem('recentEntries', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*, items(*)')
      .order('created_at', { ascending: true });

    if (data) setItems(data as (ShoppingListItem & { items: Item })[]);
    setLoading(false);
  }, []);

  const fetchAllItems = useCallback(async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setAllItems(data);
  }, []);

  useEffect(() => {
    fetchItems();
    fetchAllItems();
  }, [fetchItems, fetchAllItems]);

  // Set of item IDs currently in the shopping list
  const shoppingListItemIds = new Set(items.map(i => i.item));

  // Search-filtered suggestions (items NOT in cart)
  const suggestions = searchQuery.trim()
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !shoppingListItemIds.has(item.id)
      )
    : [];

  // Check if search matches an existing item exactly
  const exactMatch = allItems.some(
    i => i.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const addItemToList = async (itemId: string) => {
    if (shoppingListItemIds.has(itemId)) return;

    // Optimistic update
    const addedItem = allItems.find(i => i.id === itemId);
    if (addedItem) {
      setItems(prev => [...prev, {
        id: crypto.randomUUID(),
        item: itemId,
        amount: null,
        extra_info: null,
        created_at: new Date().toISOString(),
        items: addedItem,
      } as ShoppingListItem & { items: Item }]);

      addRecentEntry({
        item: addedItem,
        amount: null,
        action: 'added',
        timestamp: Date.now(),
      });
    }

    await supabase.from('shopping_list').insert({ item: itemId, amount: null });
    fetchItems(); // Re-fetch to get real IDs
  };

  const removeItem = async (id: string) => {
    const removed = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('shopping_list').delete().eq('id', id);

    if (removed?.items) {
      addRecentEntry({
        item: removed.items,
        amount: removed.amount,
        action: 'removed',
        timestamp: Date.now(),
      });
    }
  };

  const reAddItem = async (entry: RecentEntry) => {
    // Prevent duplicates
    if (shoppingListItemIds.has(entry.item.id)) return;

    await supabase.from('shopping_list').insert({
      item: entry.item.id,
      amount: entry.amount,
    });

    setRecentEntries(prev => {
      const updated = prev.map(e =>
        e.item.id === entry.item.id && e.action === 'removed' && e.timestamp === entry.timestamp
          ? { ...e, action: 'added' as const, timestamp: Date.now() }
          : e
      );
      localStorage.setItem('recentEntries', JSON.stringify(updated));
      return updated;
    });

    fetchItems();
  };

  const createAndAddItem = async () => {
    if (!searchQuery.trim()) return;

    const { data: newItem } = await supabase
      .from('items')
      .insert({ name: searchQuery.trim(), category: newItemCategory })
      .select()
      .single();

    if (newItem) {
      setAllItems(prev => [...prev, newItem]);
      await addItemToList(newItem.id);
    }

    setSearchQuery('');
    setShowNewForm(false);
    setNewItemCategory('Sonstiges');
  };

  const clearRecent = () => {
    setRecentEntries([]);
    localStorage.removeItem('recentEntries');
  };

  // Filter shopping list items by search query
  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        item.items?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Group by category
  const categoryOrder = [
    'Obst & Gemüse', 'Milchprodukte', 'Fleisch & Fisch', 'Backwaren',
    'Getränke', 'Tiefkühl', 'Konserven', 'Gewürze & Soßen',
    'Snacks & Süßes', 'Grundnahrungsmittel', 'Haushalt', 'Sonstiges',
  ];

  const grouped = filteredItems.reduce((acc, item) => {
    const cat = item.items?.category || 'Sonstiges';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'gerade eben';
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
    return 'gestern';
  };

  const renderItemCard = (item: ShoppingListItem & { items: Item }) => (
    <button
      key={item.id}
      onClick={() => removeItem(item.id)}
      className={`${getCategoryColor(item.items?.category)} rounded-2xl p-3 flex flex-col items-center justify-center aspect-square transition-all hover:scale-95 active:scale-90 shadow-sm hover:shadow-md`}
    >
      <span className="text-3xl sm:text-4xl mb-1">{getItemIcon(item.items?.name, item.items?.icon)}</span>
      <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-2">
        {item.items?.name}
      </span>
      {item.amount && (
        <span className="text-[9px] sm:text-[10px] opacity-70 mt-0.5 truncate max-w-full">
          {item.amount}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Einkaufsliste</h1>
        {items.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery.trim() && filteredItems.length !== items.length
              ? `${filteredItems.length} von ${items.length}`
              : items.length} Artikel
          </span>
        )}
      </div>

      {/* Inline search bar */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowNewForm(false); }}
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            placeholder="Artikel suchen oder hinzufügen..."
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowNewForm(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* "Hinzufügen" section - shown when search has results */}
      {searchQuery.trim() && (suggestions.length > 0 || (!exactMatch && searchQuery.trim())) && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
            Hinzufügen
          </h2>
          {suggestions.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 mb-3">
              {suggestions.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItemToList(item.id)}
                  className={`${getCategoryColor(item.category)} rounded-2xl p-3 flex flex-col items-center justify-center aspect-square transition-all hover:scale-95 active:scale-90 shadow-sm hover:shadow-md opacity-60 hover:opacity-100`}
                >
                  <span className="text-3xl sm:text-4xl mb-1">{getItemIcon(item.name, item.icon)}</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-2">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* "Neu anlegen" option - inline */}
          {!exactMatch && searchQuery.trim() && (
            <div>
              {!showNewForm ? (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-medium text-sm hover:border-emerald-400 transition-colors"
                >
                  + &quot;{searchQuery.trim()}&quot; neu anlegen
                </button>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <p className="text-sm font-medium">
                    Neuer Artikel: <span className="text-emerald-600 dark:text-emerald-400">{searchQuery.trim()}</span>
                  </p>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={createAndAddItem}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Anlegen & hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grouping toggle */}
      {filteredItems.length > 0 && (
        <div className="flex mb-5">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
            <button
              onClick={() => { if (groupByCategory) toggleGrouping(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !groupByCategory
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => { if (!groupByCategory) toggleGrouping(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                groupByCategory
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Nach Kategorie
            </button>
          </div>
        </div>
      )}

      {/* Shopping list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 && !searchQuery ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🛒</p>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Die Einkaufsliste ist leer</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Suche oben nach Artikeln, um sie hinzuzufügen
          </p>
        </div>
      ) : groupByCategory ? (
        <div className="space-y-6">
          {sortedCategories.map(category => (
            <div key={category}>
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                {category}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                {grouped[category].map(renderItemCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {filteredItems.map(renderItemCard)}
        </div>
      )}

      {/* Recent activity */}
      {recentEntries.length > 0 && (
        <div className="mt-10 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Verlauf
            </h2>
            <button
              onClick={clearRecent}
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Leeren
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {recentEntries.map((entry, idx) => (
              <div key={`${entry.item.id}-${entry.timestamp}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-lg">{getItemIcon(entry.item.name, entry.item.icon)}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${entry.action === 'removed' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                    {entry.item.name}
                  </span>
                  {entry.amount && (
                    <span className="text-xs text-gray-400 ml-1.5">{entry.amount}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatTime(entry.timestamp)}
                </span>
                {entry.action === 'removed' ? (
                  <button
                    onClick={() => reAddItem(entry)}
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      shoppingListItemIds.has(entry.item.id)
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800'
                    }`}
                    disabled={shoppingListItemIds.has(entry.item.id)}
                  >
                    +
                  </button>
                ) : (
                  <span className="flex-shrink-0 text-[10px] text-emerald-500 font-medium px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                    hinzugefügt
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
