import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useApp, waterOn } from '../store';
import { dayKey } from './dates';
import { scheduleHydrationReminders } from './notifications';

/**
 * Keeps scheduled hydration reminders in sync with settings and today's intake.
 * Runs when settings change, when water is logged, and when the app returns to the foreground.
 */
export function useReminderSync() {
  const onboarded = useApp((s) => s.onboarded);
  const reminders = useApp((s) => s.reminders);
  const petName = useApp((s) => s.petName);
  const goal = useApp((s) => s.plan?.waterMl ?? 2000);
  const water = useApp((s) => s.water);
  const [today, setToday] = useState(dayKey());
  const todayMl = waterOn(water, today);
  const reached = todayMl >= goal;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setToday(dayKey());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!onboarded) return;
    const t = setTimeout(() => {
      scheduleHydrationReminders({ reminders, petName, goalMl: goal, todayMl });
    }, 800);
    return () => clearTimeout(t);
    // only re-plan when crossing the goal, not on every sip
  }, [onboarded, reminders, petName, goal, reached, today]);
}
