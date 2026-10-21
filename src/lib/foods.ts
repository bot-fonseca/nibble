import type { MealType } from '../store';

export interface QuickFood {
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

/** Rough values per typical portion, for quick logging until AI scanning is added. */
export const QUICK_FOODS: QuickFood[] = [
  { name: 'Oatmeal with banana', emoji: '🥣', kcal: 320, protein: 9, carbs: 58, fat: 6, portion: '1 bowl' },
  { name: 'Scrambled eggs', emoji: '🍳', kcal: 210, protein: 14, carbs: 2, fat: 16, portion: '2 eggs' },
  { name: 'Toast with butter', emoji: '🍞', kcal: 180, protein: 4, carbs: 22, fat: 8, portion: '2 slices' },
  { name: 'Greek yogurt', emoji: '🥛', kcal: 150, protein: 15, carbs: 8, fat: 5, portion: '170 g' },
  { name: 'Coffee with milk', emoji: '☕', kcal: 45, protein: 2, carbs: 4, fat: 2, portion: '1 cup' },
  { name: 'Chicken & rice', emoji: '🍗', kcal: 560, protein: 42, carbs: 62, fat: 14, portion: '1 plate' },
  { name: 'Salad bowl', emoji: '🥗', kcal: 330, protein: 12, carbs: 20, fat: 22, portion: '1 bowl' },
  { name: 'Pasta bolognese', emoji: '🍝', kcal: 620, protein: 28, carbs: 78, fat: 20, portion: '1 plate' },
  { name: 'Grilled fish & veg', emoji: '🐟', kcal: 420, protein: 38, carbs: 18, fat: 20, portion: '1 plate' },
  { name: 'Sandwich', emoji: '🥪', kcal: 380, protein: 18, carbs: 42, fat: 14, portion: '1 sandwich' },
  { name: 'Pizza slice', emoji: '🍕', kcal: 285, protein: 12, carbs: 36, fat: 10, portion: '1 slice' },
  { name: 'Burger', emoji: '🍔', kcal: 540, protein: 28, carbs: 40, fat: 29, portion: '1 burger' },
  { name: 'Apple', emoji: '🍎', kcal: 95, protein: 0, carbs: 25, fat: 0, portion: '1 medium' },
  { name: 'Banana', emoji: '🍌', kcal: 105, protein: 1, carbs: 27, fat: 0, portion: '1 medium' },
  { name: 'Handful of nuts', emoji: '🥜', kcal: 175, protein: 6, carbs: 6, fat: 15, portion: '30 g' },
  { name: 'Pastel de nata', emoji: '🥮', kcal: 220, protein: 4, carbs: 26, fat: 11, portion: '1 pastry' },
  { name: 'Chocolate bar', emoji: '🍫', kcal: 230, protein: 3, carbs: 26, fat: 13, portion: '45 g' },
  { name: 'Protein shake', emoji: '🥤', kcal: 160, protein: 25, carbs: 8, fat: 3, portion: '1 shake' },
];

export const MEAL_TYPES: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snacks', emoji: '🍪' },
];

export function defaultMealType(d: Date = new Date()): MealType {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}
