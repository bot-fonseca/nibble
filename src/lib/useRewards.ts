import { useEffect } from 'react';
import { useApp, useDayTotals } from '../store';
import { addDays, dayKey, fromKey } from './dates';
import { ALL_QUESTS_BONUS, buildQuests, QUEST_REWARD } from './quests';
import { useStreak } from './streak';

/** Bamboo paid once per streak run when it reaches each length. */
export const STREAK_MILESTONES: [days: number, bamboo: number][] = [
  [3, 30],
  [7, 70],
  [14, 140],
  [30, 300],
  [100, 1000],
];

/**
 * Pays out 🎋 for today's quests and streak milestones, and spends streak freezes on missed days.
 * Mounted once at the root so it works whichever screen is open.
 */
export function useRewards() {
  const onboarded = useApp((s) => s.onboarded);
  const plan = useApp((s) => s.plan);
  const freezes = useApp((s) => s.freezes);
  const claimRewards = useApp((s) => s.claimRewards);
  const spendFreezes = useApp((s) => s.spendFreezes);
  const today = dayKey();
  const t = useDayTotals(today);
  const { won, frozen, current, runStart } = useStreak();

  const items: { key: string; amount: number }[] = [];
  if (plan) {
    const quests = buildQuests(t, plan);
    for (const q of quests) if (q.done) items.push({ key: `quest:${today}:${q.key}`, amount: QUEST_REWARD });
    if (quests.every((q) => q.done)) items.push({ key: `allquests:${today}`, amount: ALL_QUESTS_BONUS });
  }
  if (runStart) {
    for (const [days, amount] of STREAK_MILESTONES) {
      if (current >= days) items.push({ key: `streak:${runStart}:${days}`, amount });
    }
  }
  const signature = items.map((i) => i.key).join('|');

  useEffect(() => {
    if (onboarded && items.length) claimRewards(items);
    // items is rebuilt every render; its keys are what matter
  }, [onboarded, signature]);

  // cover the missed days right before today with freezes, if there are enough to bridge the gap
  useEffect(() => {
    if (!onboarded || freezes === 0) return;
    const alive = (k: string) => won.has(k) || frozen.has(k);
    const gap: string[] = [];
    let d = addDays(fromKey(today), -1);
    while (!alive(dayKey(d)) && gap.length <= freezes) {
      gap.push(dayKey(d));
      d = addDays(d, -1);
    }
    if (gap.length > 0 && gap.length <= freezes) spendFreezes(gap);
  }, [onboarded, freezes, won, frozen, today]);
}
