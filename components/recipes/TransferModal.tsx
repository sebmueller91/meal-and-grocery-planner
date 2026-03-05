'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RecipeIngredient, Item, ShoppingListItem } from '@/lib/types';
import { getItemIcon } from '@/lib/itemIcons';

interface Props {
  ingredients: (RecipeIngredient & { items: Item })[];
  onClose: () => void;
}

export function TransferModal({ ingredients, onClose }: Props) {
  const [shoppingList, setShoppingList] = useState<(ShoppingListItem & { items: Item })[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected for adding (new items not yet on the list)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Selected for updating (items already on the list)
  const [selectedForUpdate, setSelectedForUpdate] = useState<Set<string>>(new Set());
  // Custom amounts for updates
  const [updateAmounts, setUpdateAmounts] = useState<Record<string, string>>({});

  const [transferring, setTransferring] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch current shopping list on mount
  useEffect(() => {
    supabase
      .from('shopping_list')
      .select('*, items(*)')
      .then(({ data }) => {
        if (data) setShoppingList(data as (ShoppingListItem & { items: Item })[]);
        setLoading(false);
      });
  }, []);

  // Build a map: item_id → shopping list entry
  const existingMap = new Map(
    shoppingList.map(sl => [sl.item, sl])
  );

  // Once loading is done, initialize selections
  useEffect(() => {
    if (loading) return;
    const initial = new Set<string>();
    ingredients.forEach(ing => {
      if (!ing.is_common && !existingMap.has(ing.item_id)) {
        initial.add(ing.id);
      }
    });
    setSelected(initial);

    // Pre-fill update amounts with recipe amounts
    const amounts: Record<string, string> = {};
    ingredients.forEach(ing => {
      if (ing.amount) amounts[ing.id] = ing.amount;
    });
    setUpdateAmounts(amounts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleUpdate = (id: string) => {
    const next = new Set(selectedForUpdate);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForUpdate(next);
  };

  const transfer = async () => {
    setTransferring(true);

    // New items to insert
    const toInsert = ingredients
      .filter(ing => selected.has(ing.id) && !existingMap.has(ing.item_id))
      .map(ing => ({
        item: ing.item_id,
        amount: ing.amount,
      }));

    // Existing items to update
    const toUpdate = ingredients
      .filter(ing => selectedForUpdate.has(ing.id) && existingMap.has(ing.item_id));

    if (toInsert.length > 0) {
      await supabase.from('shopping_list').insert(toInsert);
    }

    for (const ing of toUpdate) {
      const newAmount = updateAmounts[ing.id] || ing.amount;
      await supabase
        .from('shopping_list')
        .update({ amount: newAmount })
        .eq('item', ing.item_id);
    }

    setTransferring(false);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  const totalActions = selected.size + selectedForUpdate.size;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-lg font-bold">Zur Einkaufsliste hinzufügen</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Vorratszutaten sind nicht vorausgewählt
          </p>
        </div>

        {/* Ingredient list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
          {ingredients.map(ing => {
            const existing = existingMap.get(ing.item_id);
            const isOnList = !!existing;
            const isSelected = isOnList ? selectedForUpdate.has(ing.id) : selected.has(ing.id);

            return (
              <div key={ing.id}>
                <button
                  onClick={() => isOnList ? toggleUpdate(ing.id) : toggleSelect(ing.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>

                  <span className="text-lg">{getItemIcon(ing.items?.name, ing.items?.icon)}</span>
                  <div className="flex-1 text-left min-w-0">
                    <span className={`text-sm ${
                      ing.is_common ? 'text-gray-400 dark:text-gray-500' : 'font-medium'
                    }`}>
                      {ing.items?.name}
                    </span>
                    {isOnList && (
                      <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                        Auf der Liste{existing.amount ? `: ${existing.amount}` : ''}
                      </div>
                    )}
                  </div>
                  {ing.amount && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{ing.amount}</span>
                  )}
                  {ing.is_common && (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                      Vorrat
                    </span>
                  )}
                  {isOnList && !ing.is_common && (
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                      Bereits vorhanden
                    </span>
                  )}
                </button>

                {/* Amount editor for existing items when selected for update */}
                {isOnList && isSelected && (
                  <div className="ml-8 mt-1.5 mb-1 flex items-center gap-2 px-3">
                    <span className="text-xs text-gray-400 whitespace-nowrap">Neue Menge:</span>
                    <input
                      type="text"
                      value={updateAmounts[ing.id] || ''}
                      onChange={e => setUpdateAmounts(prev => ({ ...prev, [ing.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder={existing.amount || 'Menge...'}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={transfer}
            disabled={totalActions === 0 || transferring || done}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          >
            {done ? 'Hinzugefügt ✓' : transferring ? 'Wird hinzugefügt...' : `${totalActions} übernehmen`}
          </button>
        </div>
      </div>
    </div>
  );
}
