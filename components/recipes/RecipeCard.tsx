'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Recipe } from '@/lib/types';

interface Props {
  recipe: Recipe;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Link href={`/rezepte/${recipe.id}`} className="block">
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-36 sm:h-40 object-cover"
            />
          ) : (
            <div className="w-full h-36 sm:h-40 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-800 flex items-center justify-center text-5xl">
              🍽️
            </div>
          )}
          <div className="p-3">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{recipe.title}</h3>
          </div>
        </div>
      </Link>

      {/* Menu button */}
      <button
        onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
        className="absolute top-2 right-2 w-8 h-8 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm hover:bg-black/50 transition-colors"
      >
        ...
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-11 right-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[140px]">
            <Link
              href={`/rezepte/${recipe.id}/bearbeiten`}
              className="block px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              Bearbeiten
            </Link>
            <button
              onClick={() => { onDelete(recipe.id); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Löschen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
