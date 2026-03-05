export const iconMap: Record<string, string> = {
  // Obst
  'apfel': '🍎', 'äpfel': '🍎', 'banane': '🍌', 'bananen': '🍌',
  'orange': '🍊', 'orangen': '🍊', 'zitrone': '🍋', 'zitronen': '🍋',
  'erdbeere': '🍓', 'erdbeeren': '🍓', 'traube': '🍇', 'trauben': '🍇',
  'birne': '🍐', 'birnen': '🍐', 'kirsche': '🍒', 'kirschen': '🍒',
  'pfirsich': '🍑', 'wassermelone': '🍉', 'ananas': '🍍', 'mango': '🥭',
  'kiwi': '🥝', 'avocado': '🥑', 'kokosnuss': '🥥', 'heidelbeeren': '🫐',
  'himbeeren': '🫐', 'limette': '🍋',

  // Gemüse
  'tomate': '🍅', 'tomaten': '🍅', 'kartoffel': '🥔', 'kartoffeln': '🥔',
  'karotte': '🥕', 'karotten': '🥕', 'möhre': '🥕', 'möhren': '🥕',
  'brokkoli': '🥦', 'broccoli': '🥦', 'salat': '🥬', 'kopfsalat': '🥬',
  'gurke': '🥒', 'gurken': '🥒', 'paprika': '🫑', 'aubergine': '🍆',
  'mais': '🌽', 'pilz': '🍄', 'pilze': '🍄', 'champignon': '🍄', 'champignons': '🍄',
  'knoblauch': '🧄', 'zwiebel': '🧅', 'zwiebeln': '🧅',
  'chili': '🌶️', 'ingwer': '🫚', 'spinat': '🥬', 'zucchini': '🥒',
  'kürbis': '🎃', 'blumenkohl': '🥦', 'lauch': '🥬', 'sellerie': '🥬',
  'radieschen': '🥕', 'erbsen': '🫛', 'bohnen': '🫘',

  // Brot & Backwaren
  'brot': '🍞', 'brötchen': '🥖', 'croissant': '🥐', 'brezel': '🥨',
  'toast': '🍞', 'baguette': '🥖', 'vollkornbrot': '🍞',

  // Milchprodukte
  'milch': '🥛', 'käse': '🧀', 'butter': '🧈', 'ei': '🥚', 'eier': '🥚',
  'joghurt': '🥛', 'sahne': '🥛', 'quark': '🥛', 'frischkäse': '🧀',
  'mozzarella': '🧀', 'parmesan': '🧀', 'gouda': '🧀', 'schmand': '🥛',
  'crème fraîche': '🥛', 'skyr': '🥛',

  // Fleisch
  'hähnchen': '🍗', 'huhn': '🍗', 'hühnchen': '🍗', 'steak': '🥩',
  'rindfleisch': '🥩', 'schweinefleisch': '🥩', 'hackfleisch': '🥩',
  'wurst': '🌭', 'speck': '🥓', 'schinken': '🥓', 'salami': '🌭',
  'putenbrust': '🍗', 'lachs': '🐟', 'fisch': '🐟', 'thunfisch': '🐟',
  'garnelen': '🦐', 'shrimps': '🦐',

  // Getränke
  'wasser': '💧', 'saft': '🧃', 'orangensaft': '🧃', 'apfelsaft': '🧃',
  'kaffee': '☕', 'tee': '🍵', 'bier': '🍺', 'wein': '🍷',
  'cola': '🥤', 'limo': '🥤', 'limonade': '🥤', 'sprudel': '💧',

  // Grundnahrungsmittel
  'reis': '🍚', 'nudeln': '🍝', 'pasta': '🍝', 'spaghetti': '🍝',
  'mehl': '🌾', 'zucker': '🍬', 'salz': '🧂', 'pfeffer': '🫙',
  'öl': '🫒', 'olivenöl': '🫒', 'sonnenblumenöl': '🫒', 'essig': '🫙',
  'honig': '🍯', 'marmelade': '🫙', 'nutella': '🫙',
  'haferflocken': '🥣', 'müsli': '🥣', 'cornflakes': '🥣',

  // Konserven & Fertig
  'dose': '🥫', 'dosentomaten': '🥫', 'kokosmilch': '🥫',
  'kichererbsen': '🥫', 'linsen': '🥫', 'passierte tomaten': '🥫',
  'tomatenmark': '🥫',

  // Gewürze
  'basilikum': '🌿', 'petersilie': '🌿', 'oregano': '🌿',
  'thymian': '🌿', 'rosmarin': '🌿', 'zimt': '🫙', 'paprikapulver': '🫙',
  'curry': '🫙', 'kurkuma': '🫙', 'muskat': '🫙',

  // Snacks & Süßes
  'schokolade': '🍫', 'chips': '🥨', 'kekse': '🍪', 'gummibärchen': '🍬',
  'eis': '🍦', 'kuchen': '🍰', 'nüsse': '🥜', 'mandeln': '🥜',
  'erdnüsse': '🥜',

  // Sonstiges
  'pizza': '🍕', 'ketchup': '🫙', 'senf': '🫙', 'sojasoße': '🫙',
  'mayonnaise': '🫙', 'backpulver': '🫙', 'hefe': '🫙',
  'gelatine': '🫙', 'vanillezucker': '🫙', 'kakao': '🫙',

  // Haushalt
  'toilettenpapier': '🧻', 'spülmittel': '🧴', 'waschmittel': '🧴',
  'seife': '🧼', 'zahnpasta': '🪥', 'taschentücher': '🤧',
  'müllbeutel': '🗑️', 'alufolie': '🫙', 'frischhaltefolie': '🫙',
};

const categoryIcons: Record<string, string> = {
  'Obst & Gemüse': '🥬',
  'Milchprodukte': '🧀',
  'Fleisch & Fisch': '🥩',
  'Backwaren': '🥖',
  'Getränke': '🥤',
  'Tiefkühl': '🧊',
  'Konserven': '🥫',
  'Gewürze & Soßen': '🌿',
  'Snacks & Süßes': '🍫',
  'Grundnahrungsmittel': '🌾',
  'Haushalt': '🧴',
  'Sonstiges': '📦',
};

export const categories = [
  'Obst & Gemüse',
  'Milchprodukte',
  'Fleisch & Fisch',
  'Backwaren',
  'Getränke',
  'Tiefkühl',
  'Konserven',
  'Gewürze & Soßen',
  'Snacks & Süßes',
  'Grundnahrungsmittel',
  'Haushalt',
  'Sonstiges',
];

export function getItemIcon(name?: string, customIcon?: string | null): string {
  if (customIcon) return customIcon;
  if (!name) return '📦';
  const lower = name.toLowerCase().trim();
  if (iconMap[lower]) return iconMap[lower];
  // Partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  return '📦';
}

export function getCategoryIcon(category?: string | null): string {
  if (!category) return '📦';
  return categoryIcons[category] || '📦';
}

export function getCategoryColor(category?: string | null): string {
  const colors: Record<string, string> = {
    'Obst & Gemüse': 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100',
    'Milchprodukte': 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100',
    'Fleisch & Fisch': 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100',
    'Backwaren': 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100',
    'Getränke': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-100',
    'Tiefkühl': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100',
    'Konserven': 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100',
    'Gewürze & Soßen': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100',
    'Snacks & Süßes': 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100',
    'Grundnahrungsmittel': 'bg-stone-100 dark:bg-stone-900/40 text-stone-900 dark:text-stone-100',
    'Haushalt': 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    'Sonstiges': 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
  };
  return colors[category || ''] || colors['Sonstiges'];
}
