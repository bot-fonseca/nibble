import type { Plan } from './plan';
import { formatLitres } from './dates';

export interface Quest {
  key: string;
  emoji: string;
  title: string;
  /** e.g. "2 / 3 meals" */
  detail: string;
  progress: number;
  done: boolean;
  over?: boolean;
}

export const QUEST_REWARD = 10;
export const ALL_QUESTS_BONUS = 20;

/** Today's daily quests, built from the day's totals. */
export function buildQuests(
  t: { meals: unknown[]; kcal: number; protein: number; waterMl: number },
  plan: Plan,
): Quest[] {
  const zoneLo = plan.calories * 0.8;
  const zoneHi = plan.calories * 1.1;
  return [
    {
      key: 'meals',
      emoji: '🍽️',
      title: 'Log 3 meals',
      detail: `${Math.min(t.meals.length, 3)} / 3 meals`,
      progress: t.meals.length / 3,
      done: t.meals.length >= 3,
    },
    {
      key: 'water',
      emoji: '💧',
      title: `Drink ${formatLitres(plan.waterMl)} of water`,
      detail: `${formatLitres(t.waterMl)} / ${formatLitres(plan.waterMl)}`,
      progress: t.waterMl / plan.waterMl,
      done: t.waterMl >= plan.waterMl,
    },
    {
      key: 'protein',
      emoji: '💪',
      title: 'Hit your protein goal',
      detail: `${Math.round(t.protein)} / ${plan.proteinG} g`,
      progress: t.protein / plan.proteinG,
      done: t.protein >= plan.proteinG,
    },
    {
      key: 'calories',
      emoji: '🎯',
      title: 'Stay in your calorie zone',
      detail:
        t.kcal > zoneHi
          ? `${Math.round(t.kcal - zoneHi)} kcal over the zone`
          : `${t.kcal} / ${Math.round(zoneLo)}–${Math.round(zoneHi)} kcal`,
      progress: t.kcal / zoneLo,
      done: t.kcal >= zoneLo && t.kcal <= zoneHi,
      over: t.kcal > zoneHi,
    },
  ];
}
