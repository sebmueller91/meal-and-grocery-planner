'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Item, Recipe, RecipeStep, RecipeIngredient } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getItemIcon, categories } from '@/lib/itemIcons';

interface Props {
  recipe?: Recipe;
  existingIngredients?: (RecipeIngredient & { items: Item })[];
  existingSteps?: RecipeStep[];
}

interface IngredientEntry {
  item_id: string;
  item_name: string;
  item_icon: string | null;
  amount: string;
  is_common: boolean;
  step_id?: string;
}

interface StepEntry {
  temp_id: string;
  step_number: number;
  instruction: string;
}

export function RecipeEditor({ recipe, existingIngredients, existingSteps }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe?.title || '');
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '');
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
  const [steps, setSteps] = useState<StepEntry[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Sonstiges');
  const [saving, setSaving] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const folder = recipe?.id || crypto.randomUUID();
      const path = `${folder}/${Date.now()}.${ext}`;

      // Delete old image if exists
      if (imageUrl) {
        const oldPath = extractStoragePath(imageUrl);
        if (oldPath) {
          await supabase.storage.from('recipe_photos').remove([oldPath]);
        }
      }

      const { error } = await supabase.storage
        .from('recipe_photos')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('recipe_photos')
        .getPublicUrl(path);

      setImageUrl(urlData.publicUrl);
      setImagePreview(urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Fehler beim Hochladen des Fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (imageUrl) {
      const path = extractStoragePath(imageUrl);
      if (path) {
        await supabase.storage.from('recipe_photos').remove([path]);
      }
    }
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setImagePreview(URL.createObjectURL(file));
    uploadPhoto(file);
  };

  useEffect(() => {
    supabase.from('items').select('*').order('name').then(({ data }) => {
      if (data) setAllItems(data);
    });

    if (existingIngredients) {
      setIngredients(existingIngredients.map(i => ({
        item_id: i.item_id,
        item_name: i.items?.name || '',
        item_icon: i.items?.icon || null,
        amount: i.amount || '',
        is_common: i.is_common,
        step_id: i.step_id || undefined,
      })));
    }
    if (existingSteps) {
      setSteps(existingSteps.map(s => ({
        temp_id: s.id,
        step_number: s.step_number,
        instruction: s.instruction,
      })));
    }
  }, [existingIngredients, existingSteps]);

  const addIngredient = (item: Item) => {
    if (ingredients.some(i => i.item_id === item.id)) return;
    setIngredients(prev => [...prev, {
      item_id: item.id,
      item_name: item.name,
      item_icon: item.icon || null,
      amount: '',
      is_common: false,
    }]);
    setSearch('');
  };

  const createAndAddIngredient = async () => {
    if (!search.trim()) return;
    const { data: newItem } = await supabase
      .from('items')
      .insert({ name: search.trim(), category: newItemCategory })
      .select()
      .single();

    if (newItem) {
      setAllItems(prev => [...prev, newItem]);
      addIngredient(newItem);
    }
    setSearch('');
  };

  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, updates: Partial<IngredientEntry>) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...updates } : ing));
  };

  const addStep = () => {
    setSteps(prev => [...prev, {
      temp_id: crypto.randomUUID(),
      step_number: prev.length + 1,
      instruction: '',
    }]);
  };

  const removeStep = (idx: number) => {
    const removedId = steps[idx].temp_id;
    setSteps(prev => prev.filter((_, i) => i !== idx));
    // Clear step_id references
    setIngredients(prev => prev.map(ing =>
      ing.step_id === removedId ? { ...ing, step_id: undefined } : ing
    ));
  };

  const updateStep = (idx: number, instruction: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, instruction } : s));
  };

  const toggleIngredientStep = (ingredientIdx: number, stepTempId: string) => {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== ingredientIdx) return ing;
      return {
        ...ing,
        step_id: ing.step_id === stepTempId ? undefined : stepTempId,
      };
    }));
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      let recipeId = recipe?.id;

      if (recipeId) {
        await supabase.from('recipes').update({
          title: title.trim(),
          image_url: imageUrl.trim() || null,
        }).eq('id', recipeId);

        // Delete existing data (ingredients first due to FK)
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
        await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
      } else {
        const { data } = await supabase
          .from('recipes')
          .insert({ title: title.trim(), image_url: imageUrl.trim() || null })
          .select()
          .single();
        recipeId = data!.id;
      }

      // Insert steps
      let stepIdMap = new Map<string, string>();

      if (steps.length > 0) {
        const stepsToInsert = steps.map((s, i) => ({
          recipe_id: recipeId,
          step_number: i + 1,
          instruction: s.instruction,
        }));

        const { data: insertedSteps } = await supabase
          .from('recipe_steps')
          .insert(stepsToInsert)
          .select();

        if (insertedSteps) {
          steps.forEach((s, i) => {
            stepIdMap.set(s.temp_id, insertedSteps[i].id);
          });
        }
      }

      // Insert ingredients
      if (ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map(ing => ({
          recipe_id: recipeId,
          item_id: ing.item_id,
          amount: ing.amount || null,
          is_common: ing.is_common,
          step_id: ing.step_id ? stepIdMap.get(ing.step_id) || null : null,
        }));

        await supabase.from('recipe_ingredients').insert(ingredientsToInsert);
      }

      router.push(`/rezepte/${recipeId}`);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = search
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        !ingredients.some(i => i.item_id === item.id)
      )
    : [];

  const exactMatch = allItems.some(
    i => i.name.toLowerCase() === search.toLowerCase()
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm font-medium"
        >
          ← Zurück
        </button>
        <h1 className="text-2xl font-bold">
          {recipe ? 'Rezept bearbeiten' : 'Neues Rezept'}
        </h1>
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Titel *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Rezeptname..."
          autoFocus
        />
      </div>

      {/* Photo upload */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
          Foto <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={imagePreview}
              alt="Rezeptfoto"
              className="w-full h-48 sm:h-56 object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!uploading && (
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  Ändern
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors shadow-sm"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span className="text-sm font-medium">Foto hinzufügen</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Ingredients */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Zutaten</h2>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Zutat suchen oder neu anlegen..."
          />

          {search && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 max-h-48 overflow-y-auto">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addIngredient(item)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                >
                  <span>{getItemIcon(item.name, item.icon)}</span>
                  <span>{item.name}</span>
                </button>
              ))}
              {!exactMatch && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-emerald-600 font-medium text-sm flex-1">
                      &quot;{search}&quot; neu anlegen
                    </span>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                      onClick={e => e.stopPropagation()}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={createAndAddIngredient}
                      className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              {filteredItems.length === 0 && exactMatch && (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  Bereits hinzugefügt
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected ingredients */}
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div
              key={ing.item_id}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
            >
              <span className="text-lg">{getItemIcon(ing.item_name, ing.item_icon)}</span>
              <span className="flex-1 font-medium text-sm min-w-0 truncate">{ing.item_name}</span>
              <input
                type="text"
                value={ing.amount}
                onChange={e => updateIngredient(idx, { amount: e.target.value })}
                className="w-20 sm:w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Menge"
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={ing.is_common}
                  onChange={e => updateIngredient(idx, { is_common: e.target.checked })}
                  className="rounded"
                />
                Vorrat
              </label>
              <button
                onClick={() => removeIngredient(idx)}
                className="text-red-400 hover:text-red-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Zubereitung</h2>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={step.temp_id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-gray-500">Schritt {idx + 1}</span>
                <button
                  onClick={() => removeStep(idx)}
                  className="ml-auto text-red-400 hover:text-red-500 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <textarea
                value={step.instruction}
                onChange={e => updateStep(idx, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
                placeholder="Anleitung für diesen Schritt..."
              />

              {/* Assign ingredients to step */}
              {ingredients.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1.5">Zutaten für diesen Schritt:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing, ingIdx) => (
                      <button
                        key={ing.item_id}
                        onClick={() => toggleIngredientStep(ingIdx, step.temp_id)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          ing.step_id === step.temp_id
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {getItemIcon(ing.item_name, ing.item_icon)} {ing.item_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addStep}
          className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors font-medium text-sm"
        >
          + Schritt hinzufügen
        </button>
      </div>

      {/* Save */}
      <div className="flex gap-3 sticky bottom-20 bg-gray-50 dark:bg-gray-950 py-3 -mx-4 px-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={save}
          disabled={!title.trim() || saving || uploading}
          className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/recipe_photos\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
