'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingListItem, Item } from '@/lib/types';
import { getItemIcon, getCategoryColor, categories } from '@/lib/itemIcons';

type AnimationType = 'checking' | 'unchecking';

export default function ShoppingListPage() {
  const [items, setItems] = useState<(ShoppingListItem & { items: Item })[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Sonstiges');
  const [showNewForm, setShowNewForm] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Map<string, AnimationType>>(new Map());

  // Track IDs that were checked on initial load (no animation for these)
  const initialCheckedIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // Split items into active and checked
  const activeItems = useMemo(
    () => items.filter(i => !i.checked),
    [items]
  );
  const checkedItems = useMemo(
    () => items.filter(i => i.checked).sort((a, b) => {
      // Most recently checked first
      const aTime = a.checked_at ? new Date(a.checked_at).getTime() : 0;
      const bTime = b.checked_at ? new Date(b.checked_at).getTime() : 0;
      return bTime - aTime;
    }),
    [items]
  );

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('groupByCategory');
    if (stored !== null) setGroupByCategory(JSON.parse(stored));
  }, []);

  const toggleGrouping = () => {
    const next = !groupByCategory;
    setGroupByCategory(next);
    localStorage.setItem('groupByCategory', JSON.stringify(next));
  };

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*, items(*)')
      .order('created_at', { ascending: true });

    if (data) {
      const typed = data as (ShoppingListItem & { items: Item })[];
      // Track initially checked IDs (only on first load)
      if (!hasInitialized.current) {
        initialCheckedIds.current = new Set(
          typed.filter(i => i.checked).map(i => i.id)
        );
        hasInitialized.current = true;
      }
      setItems(typed);
    }
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

  // Set of item IDs currently in the shopping list (both active and checked)
  const shoppingListItemIds = new Set(items.map(i => i.item));
  const activeItemIds = new Set(activeItems.map(i => i.item));

  // Search-filtered suggestions (items NOT in cart at all)
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

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    const animType: AnimationType = newChecked ? 'checking' : 'unchecking';

    // Start animation
    setAnimatingIds(prev => new Map(prev).set(id, animType));

    // After animation, update state
    setTimeout(async () => {
      // Optimistic update
      setItems(prev => prev.map(i =>
        i.id === id
          ? { ...i, checked: newChecked, checked_at: newChecked ? new Date().toISOString() : null }
          : i
      ));
      setAnimatingIds(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      // DB update
      await supabase
        .from('shopping_list')
        .update({
          checked: newChecked,
          checked_at: newChecked ? new Date().toISOString() : null,
        })
        .eq('id', id);
    }, 300);
  };

  const addItemToList = async (itemId: string) => {
    // Check if item exists as checked → reactivate it
    const checkedEntry = items.find(i => i.item === itemId && i.checked);
    if (checkedEntry) {
      // Reactivate the checked item
      setItems(prev => prev.map(i =>
        i.id === checkedEntry.id
          ? { ...i, checked: false, checked_at: null }
          : i
      ));
      await supabase
        .from('shopping_list')
        .update({ checked: false, checked_at: null })
        .eq('id', checkedEntry.id);
      return;
    }

    // Don't add if already active
    if (activeItemIds.has(itemId)) return;

    // Optimistic update
    const addedItem = allItems.find(i => i.id === itemId);
    if (addedItem) {
      setItems(prev => [...prev, {
        id: crypto.randomUUID(),
        item: itemId,
        amount: null,
        extra_info: null,
        checked: false,
        checked_at: null,
        created_at: new Date().toISOString(),
        items: addedItem,
      } as ShoppingListItem & { items: Item }]);
    }

    await supabase.from('shopping_list').insert({ item: itemId, amount: null });
    fetchItems(); // Re-fetch to get real IDs
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

  const clearChecked = async () => {
    const checkedIds = checkedItems.map(i => i.id);
    // Optimistic update
    setItems(prev => prev.filter(i => !i.checked));
    // DB delete
    await supabase.from('shopping_list').delete().in('id', checkedIds);
  };

  // Filter shopping list items by search query (only active)
  const filteredActiveItems = searchQuery.trim()
    ? activeItems.filter(item =>
        item.items?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeItems;

  // Group by category
  const categoryOrder = [
    'Obst & Gemüse', 'Milchprodukte', 'Fleisch & Fisch', 'Backwaren',
    'Getränke', 'Tiefkühl', 'Konserven', 'Gewürze & Soßen',
    'Snacks & Süßes', 'Grundnahrungsmittel', 'Haushalt', 'Sonstiges',
  ];

  const grouped = filteredActiveItems.reduce((acc, item) => {
    const cat = item.items?.category || 'Sonstiges';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredActiveItems>);

  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const renderItemCard = (item: ShoppingListItem & { items: Item }, isChecked: boolean = false) => {
    const animClass = animatingIds.get(item.id);
    const isInitialChecked = initialCheckedIds.current.has(item.id);

    // Determine CSS class for animation
    let animationClass = '';
    if (animClass) {
      animationClass = animClass === 'checking' ? 'card-checking' : 'card-unchecking';
    } else if (isChecked && !isInitialChecked) {
      animationClass = 'card-appear';
    }

    // Remove from initial set once rendered (so future toggles animate)
    if (isChecked && isInitialChecked) {
      // We'll clean this up after first render
      requestAnimationFrame(() => {
        initialCheckedIds.current.delete(item.id);
      });
    }

    if (isChecked) {
      return (
        <button
          key={item.id}
          onClick={() => toggleItem(item.id)}
          className={`bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 flex flex-col items-center justify-center aspect-square transition-all hover:scale-95 active:scale-90 ${animationClass}`}
        >
          <span className="text-3xl sm:text-4xl mb-1 grayscale opacity-40">{getItemIcon(item.items?.name, item.items?.icon)}</span>
          <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 text-gray-400 dark:text-gray-500 line-through">
            {item.items?.name}
          </span>
          {item.amount && (
            <span className="text-[9px] sm:text-[10px] opacity-40 mt-0.5 truncate max-w-full text-gray-400 dark:text-gray-500">
              {item.amount}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => toggleItem(item.id)}
        className={`${getCategoryColor(item.items?.category)} rounded-2xl p-3 flex flex-col items-center justify-center aspect-square transition-all hover:scale-95 active:scale-90 shadow-sm hover:shadow-md ${animationClass}`}
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
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Einkaufsliste</h1>
        {activeItems.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery.trim() && filteredActiveItems.length !== activeItems.length
              ? `${filteredActiveItems.length} von ${activeItems.length}`
              : activeItems.length} Artikel
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
      {filteredActiveItems.length > 0 && (
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
      ) : filteredActiveItems.length === 0 && !searchQuery && checkedItems.length === 0 ? (
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
                {grouped[category].map(item => renderItemCard(item, false))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {filteredActiveItems.map(item => renderItemCard(item, false))}
        </div>
      )}

      {/* Checked items section (Bring!-style) */}
      {checkedItems.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Erledigt ({checkedItems.length})
            </h2>
            <button
              onClick={clearChecked}
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
            >
              Alle entfernen
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {checkedItems.map(item => renderItemCard(item, true))}
          </div>
        </div>
      )}
    </div>
  );
}
