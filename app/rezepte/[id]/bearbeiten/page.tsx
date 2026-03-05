'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeStep, RecipeIngredient, Item } from '@/lib/types';
import { RecipeEditor } from '@/components/recipes/RecipeEditor';

type IngredientWithItem = RecipeIngredient & { items: Item };

export default function EditRecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<IngredientWithItem[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('recipe_ingredients').select('*, items(*)').eq('recipe_id', id),
      supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('step_number'),
    ]).then(([recipeRes, ingredientsRes, stepsRes]) => {
      if (recipeRes.data) setRecipe(recipeRes.data);
      if (ingredientsRes.data) setIngredients(ingredientsRes.data as IngredientWithItem[]);
      if (stepsRes.data) setSteps(stepsRes.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return <div className="p-4 text-center text-gray-500">Rezept nicht gefunden</div>;
  }

  return (
    <RecipeEditor
      recipe={recipe}
      existingIngredients={ingredients}
      existingSteps={steps}
    />
  );
}
