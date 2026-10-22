import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type { Reminders } from '../store';

// expo-notifications crashes on import in Expo Go on Android (its push modules
// were removed there), so only load it where it works. Reminders are a no-op otherwise.
const Notifications: typeof import('expo-notifications') | null =
  Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())
    ? null
    : require('expo-notifications');

const CHANNEL = 'hydration';
const DAYS_AHEAD = 7; // keeps us under iOS's 64 pending-notification cap

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Hydration reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#3A9BFF',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  await ensureChannel(); // Android 13+ only prompts once a channel exists
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return res.granted;
}

const MESSAGES = [
  (pet: string) => ({ title: `${pet} is thirsty 💧`, body: 'Time for a glass of water. Your pal is waiting!' }),
  (pet: string) => ({ title: 'Sip break!', body: `${pet} says a few sips now keeps the slump away.` }),
  (pet: string) => ({ title: 'Water o’clock 🥤', body: `Log a glass and make ${pet} do a happy splash.` }),
  (pet: string) => ({ title: `Psst… from ${pet}`, body: 'Have you had some water lately?' }),
];

/** Times (minutes from midnight) at which reminders fire each day. */
export function reminderSlots(r: Reminders): number[] {
  const out: number[] = [];
  const end = r.endHour * 60;
  for (let t = r.startHour * 60; t <= end; t += r.everyMinutes) out.push(t);
  return out;
}

/**
 * Re-schedules the next week of hydration reminders.
 * Today's remaining reminders are skipped once the goal is reached.
 */
export async function scheduleHydrationReminders(opts: {
  reminders: Reminders;
  petName: string;
  goalMl: number;
  todayMl: number;
}) {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!opts.reminders.enabled) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await ensureChannel();

    const now = new Date();
    const slots = reminderSlots(opts.reminders);
    let n = 0;
    for (let d = 0; d < DAYS_AHEAD; d++) {
      if (d === 0 && opts.todayMl >= opts.goalMl) continue;
      for (const mins of slots) {
        const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 0, mins);
        if (when.getTime() <= now.getTime() + 60_000) continue;
        const msg = MESSAGES[n++ % MESSAGES.length](opts.petName);
        await Notifications.scheduleNotificationAsync({
          content: { ...msg, data: { kind: 'hydration' } },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            channelId: CHANNEL,
          },
        });
        if (n >= 60) return;
      }
    }
  } catch (e) {
    console.warn('Could not schedule reminders', e);
  }
}
