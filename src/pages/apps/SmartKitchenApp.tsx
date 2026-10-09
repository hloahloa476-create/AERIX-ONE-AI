import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  Heart,
  Share2,
  Timer
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface SmartKitchenAppProps {
  onClose: () => void;
}

export const SmartKitchenApp: React.FC<SmartKitchenAppProps> = ({ onClose }) => {
  const [ingredients, setIngredients] = useState<string[]>(['Salmon fillet', 'Avocado', 'Quinoa', 'Lemon', 'Olive oil']);
  const [newIngredient, setNewIngredient] = useState('');
  const [dietary, setDietary] = useState<'Any' | 'Keto' | 'High-Protein' | 'Vegan' | 'Gluten-Free'>('High-Protein');
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeRecipe, setActiveRecipe] = useState({
    title: 'Pan-Seared Citrus Salmon & Avocado Quinoa Bowl',
    prepTime: '20 Mins',
    calories: '540 kcal',
    protein: '42g',
    carbs: '38g',
    fats: '24g',
    ingredients: [
      '200g Fresh Atlantic Salmon fillet',
      '1/2 Ripe Hass avocado, sliced',
      '1 cup Cooked organic quinoa',
      '1 tbsp Extra virgin olive oil',
      'Juice of 1 fresh lemon + zest',
      'Sea salt & cracked black pepper to taste'
    ],
    steps: [
      'Rinse quinoa thoroughly and simmer in water for 12 minutes until fluffy.',
      'Season salmon fillet generously with sea salt, pepper, and freshly grated lemon zest.',
      'Heat olive oil in a cast iron skillet over medium-high heat. Sear salmon skin-side down for 4 minutes until crispy.',
      'Flip fillet and cook for another 3 minutes until medium-rare inside.',
      'Assemble quinoa into a shallow bowl, top with sliced avocado and salmon, drizzle with lemon juice.'
    ]
  });

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    setIngredients((prev) => [...prev, newIngredient.trim()]);
    setNewIngredient('');
  };

  const handleGenerateRecipe = () => {
    soundEffects.playHapticClick();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      soundEffects.playSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      {/* Header */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lime-500/20 border border-lime-500/40 text-lime-400 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">SMART KITCHEN</h1>
              <p className="text-[10px] font-mono text-lime-400">Chef AI Assistant v1.8</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-3xl mx-auto w-full space-y-4 pb-24">
        {/* Pantry & Ingredient Selector */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-lime-400 uppercase tracking-wider">
              Available Ingredients ({ingredients.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Pantry Matcher</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="py-1 pl-2.5 pr-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white flex items-center gap-1.5"
              >
                <span>{ing}</span>
                <button
                  onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddIngredient} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Add another ingredient (e.g., garlic, cherry tomatoes)..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-lime-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Dietary selection */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
            {(['Any', 'Keto', 'High-Protein', 'Vegan', 'Gluten-Free'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDietary(opt)}
                className={`py-1 px-3 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all ${
                  dietary === opt
                    ? 'bg-lime-500 text-slate-950 font-bold shadow-md shadow-lime-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateRecipe}
            disabled={isGenerating || ingredients.length === 0}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isGenerating ? 'Chef AI is Creating Recipe...' : 'Generate Customized Recipe'}</span>
          </button>
        </div>

        {/* Generated Recipe Card */}
        <div className="p-5 rounded-3xl aerix-glass border border-lime-500/40 bg-slate-900/60 space-y-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-lime-400 uppercase font-bold">
                Chef Recommended
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">{activeRecipe.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-lime-500/20 text-lime-300 text-[10px] font-mono border border-lime-500/30">
                {dietary}
              </span>
            </div>
          </div>

          {/* Macro Pills */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 block">Prep Time</span>
              <span className="text-xs font-bold text-white">{activeRecipe.prepTime}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 block">Calories</span>
              <span className="text-xs font-bold text-amber-400">{activeRecipe.calories}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 block">Protein</span>
              <span className="text-xs font-bold text-emerald-400">{activeRecipe.protein}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 block">Carbs</span>
              <span className="text-xs font-bold text-cyan-400">{activeRecipe.carbs}</span>
            </div>
          </div>

          {/* Ingredients Breakdown */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Ingredients Needed
            </h3>
            <div className="space-y-1">
              {activeRecipe.ingredients.map((item, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Step-by-Step Instructions
            </h3>
            <div className="space-y-2">
              {activeRecipe.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-850 flex gap-3">
                  <span className="w-5 h-5 rounded-lg bg-lime-500/20 text-lime-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
