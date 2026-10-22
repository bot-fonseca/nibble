import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Reminders } from '../store';
import { colors, themed } from '../theme';
import { Card, Chip, Squish, T } from './ui';

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function RemindersEditor({ value, onChange }: { value: Reminders; onChange: (r: Reminders) => void }) {
  const upd = (p: Partial<Reminders>) => onChange({ ...value, ...p });
  return (
    <Card style={{ gap: 18 }}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T size={22}>🔔</T>
          <T weight="bold" size={17}>
            Hydration reminders
          </T>
        </View>
        <Switch
          value={value.enabled}
          onValueChange={(v) => upd({ enabled: v })}
          trackColor={{ true: colors.primary, false: colors.line }}
          thumbColor={colors.white}
        />
      </View>
      {value.enabled && (
        <Animated.View entering={FadeIn} style={{ gap: 16 }}>
          <View style={styles.rowBetween}>
            <T color={colors.inkSoft}>From</T>
            <MiniStepper
              label={hh(value.startHour)}
              onMinus={() => upd({ startHour: Math.max(5, value.startHour - 1) })}
              onPlus={() => upd({ startHour: Math.min(value.endHour - 2, value.startHour + 1) })}
            />
          </View>
          <View style={styles.rowBetween}>
            <T color={colors.inkSoft}>Until</T>
            <MiniStepper
              label={hh(value.endHour)}
              onMinus={() => upd({ endHour: Math.max(value.startHour + 2, value.endHour - 1) })}
              onPlus={() => upd({ endHour: Math.min(23, value.endHour + 1) })}
            />
          </View>
          <T color={colors.inkSoft}>Remind me every</T>
          <View style={styles.chips}>
            {[60, 90, 120, 180].map((m) => (
              <Chip
                key={m}
                label={m === 90 ? '1½ h' : `${m / 60} h`}
                selected={value.everyMinutes === m}
                onPress={() => upd({ everyMinutes: m })}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </Card>
  );
}

export function MiniStepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Squish onPress={onMinus} style={styles.miniBtn}>
        <Ionicons name="remove" size={18} color={colors.primaryDark} />
      </Squish>
      <T weight="bold" size={17} style={{ minWidth: 56, textAlign: 'center' }}>
        {label}
      </T>
      <Squish onPress={onPlus} style={styles.miniBtn}>
        <Ionicons name="add" size={18} color={colors.primaryDark} />
      </Squish>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
