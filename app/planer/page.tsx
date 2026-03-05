'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, MealPlan } from '@/lib/types';

const MEAL_TYPES = ['Frühstück', 'Mittagessen', 'Abendessen'] as const;
const MEAL_ICONS: Record<string, string> = {
  'Frühstück': '🌅',
  'Mittagessen': '☀️',
  'Abendessen': '🌙',
};

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Get Monday of the week containing the given date */
function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  // getDay(): 0=Sun, 1=Mon, ... 6=Sat → offset to Monday
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

/** ISO week number */
function getWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function PlanerPage() {
  const [mealPlans, setMealPlans] = useState<(MealPlan & { recipes?: Recipe })[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(getToday()));
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerSearch, setPickerSearch] = useState('');

  const weekEnd = addDays(weekStart, 6); // Sunday

  const fetchPlans = useCallback(async () => {
    const from = formatDate(weekStart);
    const to = formatDate(weekEnd);

    const { data } = await supabase
      .from('meal_plan')
      .select('*, recipes(*)')
      .gte('date', from)
      .lte('date', to)
      .order('date');

    if (data) setMealPlans(data as (MealPlan & { recipes?: Recipe })[]);
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => {
    supabase.from('recipes').select('*').order('title').then(({ data }) => {
      if (data) setRecipes(data);
    });
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const assignRecipe = async (date: string, mealType: string, recipeId: string) => {
    const existing = mealPlans.find(p => p.date === date && p.meal_type === mealType);
    if (existing) {
      await supabase.from('meal_plan').update({ recipe_id: recipeId, custom_title: null }).eq('id', existing.id);
    } else {
      await supabase.from('meal_plan').insert({ recipe_id: recipeId, custom_title: null, date, meal_type: mealType });
    }
    closeSlotPicker();
    fetchPlans();
  };

  const assignCustom = async (date: string, mealType: string, title: string) => {
    if (!title.trim()) return;
    const existing = mealPlans.find(p => p.date === date && p.meal_type === mealType);
    if (existing) {
      await supabase.from('meal_plan').update({ recipe_id: null, custom_title: title.trim() }).eq('id', existing.id);
    } else {
      await supabase.from('meal_plan').insert({ recipe_id: null, custom_title: title.trim(), date, meal_type: mealType });
    }
    closeSlotPicker();
    fetchPlans();
  };

  const removePlan = async (id: string) => {
    setMealPlans(prev => prev.filter(p => p.id !== id));
    await supabase.from('meal_plan').delete().eq('id', id);
  };

  const closeSlotPicker = () => {
    setSelectedSlot(null);
    setPickerSearch('');
  };

  const goToThisWeek = () => setWeekStart(getMonday(getToday()));
  const goPrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const goNextWeek = () => setWeekStart(addDays(weekStart, 7));

  const todayStr = formatDate(getToday());
  const isCurrentWeek = formatDate(getMonday(getToday())) === formatDate(weekStart);

  const filteredRecipes = pickerSearch.trim()
    ? recipes.filter(r => r.title.toLowerCase().includes(pickerSearch.toLowerCase()))
    : recipes;

  const exactRecipeMatch = recipes.some(
    r => r.title.toLowerCase() === pickerSearch.trim().toLowerCase()
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = formatDate(date);
    return { date, dateStr };
  });

  // Week header: "3. – 9. März 2026 · KW 10"
  const weekLabel = (() => {
    const s = weekStart;
    const e = weekEnd;
    const sameMonth = s.getMonth() === e.getMonth();
    const startDay = s.getDate();
    const endDay = e.getDate();
    const endMonth = e.toLocaleDateString('de-DE', { month: 'long' });
    const year = e.getFullYear();
    const kw = getWeekNumber(weekStart);

    if (sameMonth) {
      return `${startDay}. – ${endDay}. ${endMonth} ${year} · KW ${kw}`;
    } else {
      const startMonth = s.toLocaleDateString('de-DE', { month: 'short' });
      const endMonthShort = e.toLocaleDateString('de-DE', { month: 'short' });
      return `${startDay}. ${startMonth} – ${endDay}. ${endMonthShort} ${year} · KW ${kw}`;
    }
  })();

  /** Display title for a meal plan entry */
  const planTitle = (plan: MealPlan & { recipes?: Recipe }) =>
    plan.recipes?.title || plan.custom_title || '';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Essensplaner</h1>
          {!isCurrentWeek && (
            <button
              onClick={goToThisWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Aktuelle Woche
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goPrevWeek}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-base font-semibold text-gray-600 dark:text-gray-300">{weekLabel}</span>
          <button
            onClick={goNextWeek}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {days.map(({ date, dateStr }) => {
            const isToday = dateStr === todayStr;
            const isTomorrow = dateStr === formatDate(addDays(getToday(), 1));
            const dayLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : null;

            return (
              <div key={dateStr}>
                {/* Day label — outside the box */}
                <div className="flex items-baseline gap-2 mb-1.5 px-1">
                  <span className={`text-sm font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {date.toLocaleDateString('de-DE', { weekday: 'long' })}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
                  </span>
                  {dayLabel && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {dayLabel}
                    </span>
                  )}
                </div>

                {/* Meal slots box */}
                <div className={`rounded-2xl border p-3 transition-colors ${
                  isToday
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {MEAL_TYPES.map(mealType => {
                      const plan = mealPlans.find(
                        p => p.date === dateStr && p.meal_type === mealType
                      );

                      if (plan) {
                        const isRecipe = !!plan.recipe_id && plan.recipes;
                        return (
                          <div
                            key={mealType}
                            className="group relative bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 flex items-center gap-2.5"
                          >
                            {isRecipe && plan.recipes?.image_url ? (
                              <img
                                src={plan.recipes.image_url}
                                alt={plan.recipes.title}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-lg flex-shrink-0">
                                {isRecipe ? '🍽️' : '✏️'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                {MEAL_ICONS[mealType]} {mealType}
                              </div>
                              <div className="text-xs font-medium truncate">
                                {planTitle(plan)}
                              </div>
                            </div>
                            <button
                              onClick={() => removePlan(plan.id)}
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-xs transition-opacity hover:bg-red-200 dark:hover:bg-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={mealType}
                          onClick={() => { setSelectedSlot({ date: dateStr, mealType }); setPickerSearch(''); }}
                          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-2.5 flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                        >
                          <span className="text-sm">{MEAL_ICONS[mealType]}</span>
                          <span className="text-[11px] font-medium">{mealType}</span>
                          <span className="ml-auto text-lg leading-none">+</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Picker modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={closeSlotPicker}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
              <h2 className="text-lg font-bold mb-1">Mahlzeit hinzufügen</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {MEAL_ICONS[selectedSlot.mealType]} {selectedSlot.mealType} am{' '}
                {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              <input
                type="text"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && pickerSearch.trim() && filteredRecipes.length === 0) {
                    assignCustom(selectedSlot.date, selectedSlot.mealType, pickerSearch);
                  }
                }}
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Rezept suchen oder Freitext eingeben..."
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {/* Free text option - shown when typing and no exact recipe match */}
              {pickerSearch.trim() && !exactRecipeMatch && (
                <button
                  onClick={() => assignCustom(selectedSlot.date, selectedSlot.mealType, pickerSearch)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 mx-0 mb-1 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-lg flex-shrink-0">
                    ✏️
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-medium text-sm text-emerald-700 dark:text-emerald-300">&quot;{pickerSearch.trim()}&quot;</span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">Als Freitext hinzufügen</span>
                  </div>
                </button>
              )}

              {/* Recipe list */}
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => assignRecipe(selectedSlot.date, selectedSlot.mealType, recipe.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-lg flex-shrink-0">
                        🍽️
                      </div>
                    )}
                    <span className="font-medium text-sm text-left">{recipe.title}</span>
                  </button>
                ))
              ) : !pickerSearch.trim() ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Noch keine Rezepte vorhanden
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={closeSlotPicker}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
