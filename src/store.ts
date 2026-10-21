import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKey } from './lib/dates';
import type { Plan, Profile } from './lib/plan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  day: string;
  at: number;
  type: MealType;
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WaterEntry {
  id: string;
  day: string;
  at: number;
  ml: number;
}

export interface Reminders {
  enabled: boolean;
  startHour: number;
  endHour: number;
  everyMinutes: number;
}

interface State {
  hydrated: boolean;
  onboarded: boolean;
  profile: Profile | null;
  plan: Plan | null;
  petName: string;
  glassMl: number;
  reminders: Reminders;
  meals: Meal[];
  water: WaterEntry[];

  finishOnboarding: (data: {
    profile: Profile;
    plan: Plan;
    petName: string;
    glassMl: number;
    reminders: Reminders;
  }) => void;
  addMeal: (m: Omit<Meal, 'id' | 'at' | 'day'> & { day?: string }) => void;
  removeMeal: (id: string) => void;
  addWater: (ml: number, day?: string) => void;
  removeWater: (id: string) => void;
  setWaterGoal: (ml: number) => void;
  setCalorieGoal: (kcal: number) => void;
  setGlass: (ml: number) => void;
  setReminders: (r: Partial<Reminders>) => void;
  renamePet: (name: string) => void;
  reset: () => void;
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const initial = {
  onboarded: false,
  profile: null,
  plan: null,
  petName: 'Ollie',
  glassMl: 250,
  reminders: { enabled: true, startHour: 9, endHour: 21, everyMinutes: 120 },
  meals: [] as Meal[],
  water: [] as WaterEntry[],
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      ...initial,

      finishOnboarding: (d) =>
        set({
          onboarded: true,
          profile: d.profile,
          plan: d.plan,
          petName: d.petName,
          glassMl: d.glassMl,
          reminders: d.reminders,
        }),

      addMeal: ({ day, ...m }) =>
        set((s) => ({
          meals: [...s.meals, { ...m, id: uid(), at: Date.now(), day: day ?? dayKey() }],
        })),
      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      addWater: (ml, day) =>
        set((s) => ({
          water: [...s.water, { id: uid(), ml, at: Date.now(), day: day ?? dayKey() }],
        })),
      removeWater: (id) => set((s) => ({ water: s.water.filter((w) => w.id !== id) })),

      setWaterGoal: (ml) => set((s) => (s.plan ? { plan: { ...s.plan, waterMl: ml } } : {})),
      setCalorieGoal: (kcal) => set((s) => (s.plan ? { plan: { ...s.plan, calories: kcal } } : {})),
      setGlass: (ml) => set({ glassMl: ml }),
      setReminders: (r) => set((s) => ({ reminders: { ...s.reminders, ...r } })),
      renamePet: (name) => set({ petName: name }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'nibble-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);

/** Totals for a given day. */
export function useDayTotals(day: string) {
  const meals = useApp((s) => s.meals);
  const water = useApp((s) => s.water);
  const dayMeals = meals.filter((m) => m.day === day);
  return {
    meals: dayMeals,
    kcal: dayMeals.reduce((a, m) => a + m.kcal, 0),
    protein: dayMeals.reduce((a, m) => a + m.protein, 0),
    carbs: dayMeals.reduce((a, m) => a + m.carbs, 0),
    fat: dayMeals.reduce((a, m) => a + m.fat, 0),
    waterMl: water.filter((w) => w.day === day).reduce((a, w) => a + w.ml, 0),
    waterEntries: water.filter((w) => w.day === day).sort((a, b) => b.at - a.at),
  };
}

export function waterOn(water: WaterEntry[], day: string) {
  return water.filter((w) => w.day === day).reduce((a, w) => a + w.ml, 0);
}
