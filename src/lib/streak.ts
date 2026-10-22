import { useMemo } from 'react';
import { useApp } from '../store';
import { addDays, dayKey, fromKey } from './dates';
import { goalsMet } from './mood';

export interface StreakInfo {
  /** Days (YYYY-MM-DD) on which both daily goals were met. */
  won: Set<string>;
  /** Missed days that a streak freeze covered. */
  frozen: Set<string>;
  current: number;
  longest: number;
  todayWon: boolean;
  /** First day of the current streak, or null when there is none. */
  runStart: string | null;
}

/**
 * Streak of consecutive days with both goals hit. Frozen days keep a streak alive without
 * adding to it. Today only counts once it's reached, so an unfinished today doesn't break
 * a streak that ran through yesterday.
 */
export function useStreak(): StreakInfo {
  const meals = useApp((s) => s.meals);
  const water = useApp((s) => s.water);
  const frozenDays = useApp((s) => s.frozenDays);
  const kcalGoal = useApp((s) => s.plan?.calories ?? 0);
  const waterGoal = useApp((s) => s.plan?.waterMl ?? 0);
  const today = dayKey();

  return useMemo(() => {
    const won = new Set<string>();
    if (kcalGoal && waterGoal) {
      const kcal = new Map<string, number>();
      const ml = new Map<string, number>();
      for (const m of meals) kcal.set(m.day, (kcal.get(m.day) ?? 0) + m.kcal);
      for (const w of water) ml.set(w.day, (ml.get(w.day) ?? 0) + w.ml);
      for (const day of new Set([...kcal.keys(), ...ml.keys()])) {
        if (goalsMet(kcal.get(day) ?? 0, kcalGoal, ml.get(day) ?? 0, waterGoal)) won.add(day);
      }
    }
    const frozen = new Set(frozenDays.filter((d) => !won.has(d)));
    const alive = (k: string) => won.has(k) || frozen.has(k);

    let current = 0;
    let runStart: string | null = null;
    let d = fromKey(today);
    if (!won.has(today)) d = addDays(d, -1);
    while (alive(dayKey(d))) {
      const k = dayKey(d);
      if (won.has(k)) {
        current++;
        runStart = k;
      }
      d = addDays(d, -1);
    }

    let longest = 0;
    let run = 0;
    let prev: string | null = null;
    for (const day of [...won, ...frozen].sort()) {
      const continues = prev !== null && dayKey(addDays(fromKey(prev), 1)) === day;
      run = (continues ? run : 0) + (won.has(day) ? 1 : 0);
      longest = Math.max(longest, run);
      prev = day;
    }

    return { won, frozen, current, longest, todayWon: won.has(today), runStart };
  }, [meals, water, frozenDays, kcalGoal, waterGoal, today]);
}
