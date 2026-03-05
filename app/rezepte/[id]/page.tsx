'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeStep, RecipeIngredient, Item } from '@/lib/types';
import { getItemIcon } from '@/lib/itemIcons';
import { TransferModal } from '@/components/recipes/TransferModal';

type IngredientWithItem = RecipeIngredient & { items: Item };

export default function RecipeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [ingredients, setIngredients] = useState<IngredientWithItem[]>([]);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [cookMode, setCookMode] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecipe = useCallback(async () => {
    const [recipeRes, stepsRes, ingredientsRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('step_number'),
      supabase.from('recipe_ingredients').select('*, items(*)').eq('recipe_id', id),
    ]);

    if (recipeRes.data) setRecipe(recipeRes.data);
    if (stepsRes.data) setSteps(stepsRes.data);
    if (ingredientsRes.data) setIngredients(ingredientsRes.data as IngredientWithItem[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const toggleCookMode = async () => {
    if (cookMode) {
      if (wakeLock) {
        await wakeLock.release();
        setWakeLock(null);
      }
      setCookMode(false);
    } else {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch (err) {
        console.log('Wake Lock not available:', err);
      }
      setCookMode(true);
    }
  };

  useEffect(() => {
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [wakeLock]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Rezept nicht gefunden</p>
        <button onClick={() => router.push('/rezepte')} className="mt-4 text-emerald-600 font-medium">
          Zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto px-4 pt-6 pb-8 ${cookMode ? 'text-lg' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => router.push('/rezepte')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium"
        >
          ← Zurück
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={toggleCookMode}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              cookMode
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cookMode ? '🔥 Koch-Modus an' : '👨‍🍳 Koch-Modus'}
          </button>
          <button
            onClick={() => router.push(`/rezepte/${id}/bearbeiten`)}
            className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Bearbeiten
          </button>
        </div>
      </div>

      {/* Title & Image */}
      <h1 className={`font-bold mb-4 ${cookMode ? 'text-3xl' : 'text-2xl'}`}>{recipe.title}</h1>

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-48 sm:h-64 object-cover rounded-2xl mb-6"
        />
      )}

      {/* Ingredients */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`font-semibold ${cookMode ? 'text-xl' : 'text-lg'}`}>Zutaten</h2>
          <button
            onClick={() => setShowTransfer(true)}
            className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            🛒 Zur Einkaufsliste hinzufügen
          </button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {ingredients.map(ing => (
            <div key={ing.id} className={`flex items-center gap-3 px-4 ${cookMode ? 'py-3' : 'py-2.5'}`}>
              <span className={cookMode ? 'text-2xl' : 'text-lg'}>{getItemIcon(ing.items?.name, ing.items?.icon)}</span>
              <span className={`flex-1 ${ing.is_common ? 'text-gray-400 dark:text-gray-500' : 'font-medium'}`}>
                {ing.items?.name}
              </span>
              {ing.amount && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">{ing.amount}</span>
              )}
              {ing.is_common && (
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                  Vorrat
                </span>
              )}
            </div>
          ))}
          {ingredients.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400">Keine Zutaten</div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 className={`font-semibold mb-3 ${cookMode ? 'text-xl' : 'text-lg'}`}>Zubereitung</h2>
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const stepIngredients = ingredients.filter(ing => ing.step_id === step.id);
            return (
              <div
                key={step.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`whitespace-pre-wrap ${cookMode ? 'text-lg leading-relaxed' : ''}`}>
                      {step.instruction}
                    </p>
                    {stepIngredients.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {stepIngredients.map(ing => (
                          <span
                            key={ing.id}
                            className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full"
                          >
                            {getItemIcon(ing.items?.name, ing.items?.icon)} {ing.items?.name}
                            {ing.amount ? ` (${ing.amount})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {steps.length === 0 && (
            <div className="text-center py-6 text-gray-400">Keine Schritte vorhanden</div>
          )}
        </div>
      </div>

      {/* Cook mode indicator */}
      {cookMode && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40 animate-pulse">
          🔥 Display bleibt an
        </div>
      )}

      {showTransfer && (
        <TransferModal
          ingredients={ingredients}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
