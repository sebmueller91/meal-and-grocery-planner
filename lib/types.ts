export interface Item {
  id: string;
  name: string;
  category: string | null;
  icon: string | null;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  item: string;
  amount: string | null;
  extra_info: string | null;
  created_at: string;
  items?: Item;
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  recipe_id: string | null;
  custom_title: string | null;
  date: string;
  meal_type: 'Frühstück' | 'Mittagessen' | 'Abendessen';
  created_at: string;
  recipes?: Recipe;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  step_id: string | null;
  amount: string | null;
  is_common: boolean;
  created_at: string;
  items?: Item;
}
