import type { Mood } from '../components/Pet';

/** A day counts as a win when water is at goal and calories land within 80–110% of target. */
export function goalsMet(kcal: number, kcalGoal: number, waterMl: number, waterGoal: number): boolean {
  const food = kcal / kcalGoal;
  return waterMl >= waterGoal && food >= 0.8 && food <= 1.1;
}

export function petMood(opts: {
  hour: number;
  kcal: number;
  kcalGoal: number;
  waterMl: number;
  waterGoal: number;
  mealsCount: number;
  isToday: boolean;
}): Mood {
  const { hour, kcal, kcalGoal, waterMl, waterGoal, mealsCount, isToday } = opts;
  const water = waterMl / waterGoal;
  const food = kcal / kcalGoal;
  if (!isToday) return water >= 1 && food >= 0.8 ? 'happy' : 'content';
  const expected = Math.min(1, Math.max(0, (hour - 8) / 13));
  if (goalsMet(kcal, kcalGoal, waterMl, waterGoal)) return 'excited';
  if (hour >= 23 || hour < 6) return 'sleepy';
  if (water < expected - 0.25) return 'thirsty';
  if ((mealsCount === 0 && hour >= 10) || food < expected - 0.4) return 'hungry';
  if (water >= 1 || food >= 0.5) return 'happy';
  return 'content';
}

export function petLine(mood: Mood, pet: string, user: string): string {
  switch (mood) {
    case 'excited':
      return `Goals smashed! ${pet} is doing a happy dance 🎉`;
    case 'happy':
      return `Yum, thanks ${user || 'friend'}! Keep it coming.`;
    case 'thirsty':
      return 'My whiskers are drying out… a glass of water?';
    case 'hungry':
      return 'Tummy’s rumbling. What are we eating?';
    case 'sleepy':
      return 'Getting sleepy… great job today.';
    default:
      return `Hi ${user || 'there'}! Log a meal to feed me.`;
  }
}
