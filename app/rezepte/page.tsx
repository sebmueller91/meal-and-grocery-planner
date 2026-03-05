'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import { RecipeCard } from '@/components/recipes/RecipeCard';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRecipes(data);
        setLoading(false);
      });
  }, []);

  const deleteRecipe = async (id: string) => {
    // Delete in correct order due to FK constraints
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
    await supabase.from('recipe_steps').delete().eq('recipe_id', id);
    await supabase.from('recipes').delete().eq('id', id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rezepte</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">📖</p>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Noch keine Rezepte vorhanden</p>
          <button
            onClick={() => router.push('/rezepte/neu')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Rezept erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={deleteRecipe} />
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/rezepte/neu')}
        className="fixed right-5 bottom-[5.5rem] w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-emerald-700 active:scale-95 transition-all z-40"
      >
        +
      </button>
    </div>
  );
}
