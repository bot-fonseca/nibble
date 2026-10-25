import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pet } from '../../components/Pet';
import { Card, enter, Squish, T, tap } from '../../components/ui';
import { WaterGlass } from '../../components/WaterGlass';
import { addDays, dayKey, formatLitres, formatTime, WEEKDAY_SHORT } from '../../lib/dates';
import { reminderSlots } from '../../lib/notifications';
import { IS_WEB } from '../../lib/platform';
import { useApp, useDayTotals, waterOn } from '../../store';
import { colors, fonts, radius, themed } from '../../theme';

/** How many of today's drinks to show before "Show all". */
const LOG_PREVIEW = 3;

export default function Water() {
  const insets = useSafeAreaInsets();
  const goal = useApp((s) => s.plan?.waterMl ?? 2000);
  const glassMl = useApp((s) => s.glassMl);
  const reminders = useApp((s) => s.reminders);
  const petName = useApp((s) => s.petName);
  const allWater = useApp((s) => s.water);
  const addWater = useApp((s) => s.addWater);
  const removeWater = useApp((s) => s.removeWater);
  const setWaterGoal = useApp((s) => s.setWaterGoal);
  const today = dayKey();
  const t = useDayTotals(today);
  const [custom, setCustom] = useState('');
  const [bounce, setBounce] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const pct = Math.round((t.waterMl / goal) * 100);
  const reached = t.waterMl >= goal;

  const drink = (ml: number) => {
    if (!ml || ml <= 0) return;
    addWater(Math.min(ml, 3000));
    setBounce((b) => b + 1);
    tap('medium');
  };

  // last 7 days
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    return { d, ml: waterOn(allWater, dayKey(d)) };
  });

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nextSlot = reminderSlots(reminders).find((m) => m > nowMins);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 18, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={enter(0)}>
        <T weight="black" size={28}>
          Hydration
        </T>
        <T size={15} color={colors.inkSoft}>
          {reached ? `Goal reached — ${petName} is splashing around! 🎉` : `${formatLitres(Math.max(0, goal - t.waterMl))} to go today`}
        </T>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Card style={styles.hero}>
          <View style={{ alignItems: 'center' }}>
            <WaterGlass width={170} progress={t.waterMl / goal} />
            <View style={styles.glassLabel}>
              <T weight="black" size={34} color={t.waterMl / goal > 0.45 ? colors.white : colors.waterDeep}>
                {pct}%
              </T>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Pet size={92} mood={reached ? 'excited' : t.waterMl === 0 ? 'thirsty' : 'happy'} bounceKey={bounce} />
            <T weight="black" size={24}>
              {formatLitres(t.waterMl)}
            </T>
            <T size={13} color={colors.inkSoft}>
              of {formatLitres(goal)}
            </T>
            <View style={styles.goalRow}>
              <Squish onPress={() => setWaterGoal(Math.max(1000, goal - 250))} style={styles.goalBtn}>
                <Ionicons name="remove" size={16} color={colors.waterDeep} />
              </Squish>
              <T size={12} weight="bold" color={colors.inkSoft}>
                goal
              </T>
              <Squish onPress={() => setWaterGoal(Math.min(5000, goal + 250))} style={styles.goalBtn}>
                <Ionicons name="add" size={16} color={colors.waterDeep} />
              </Squish>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={enter(2)} style={styles.quickRow}>
        {[
          { ml: glassMl, label: 'Glass', icon: '🥛' },
          { ml: 500, label: 'Bottle', icon: '🧴' },
          { ml: 750, label: 'Big bottle', icon: '🍶' },
        ].map((q) => (
          <Squish key={q.label} onPress={() => drink(q.ml)} style={styles.quick}>
            <T size={26}>{q.icon}</T>
            <T weight="black" size={16} color={colors.waterDeep}>
              +{q.ml} ml
            </T>
            <T size={12} color={colors.inkSoft}>
              {q.label}
            </T>
          </Squish>
        ))}
      </Animated.View>

      <Card style={styles.customRow}>
        <TextInput
          value={custom}
          onChangeText={(v) => setCustom(v.replace(/[^0-9]/g, ''))}
          placeholder="Custom amount (ml)"
          placeholderTextColor={colors.inkFaint}
          keyboardType="number-pad"
          style={styles.input}
          maxLength={4}
        />
        <Squish
          disabled={!custom}
          onPress={() => {
            drink(Number(custom));
            setCustom('');
          }}
          style={[styles.addCustom, !custom && { opacity: 0.4 }]}
        >
          <T weight="bold" color={colors.white}>
            Add
          </T>
        </Squish>
      </Card>

      {/* weekly */}
      <Card>
        <T weight="bold" size={16} style={{ marginBottom: 14 }}>
          Last 7 days
        </T>
        <View style={styles.chart}>
          {week.map(({ d, ml }, i) => {
            const h = Math.min(1, ml / goal);
            const hit = ml >= goal;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={styles.barTrack}>
                  <Animated.View
                    entering={enter(3)}
                    style={{ height: `${Math.max(4, h * 100)}%`, width: '100%', borderRadius: 10, backgroundColor: hit ? colors.water : colors.waterBarSoft }}
                  />
                </View>
                <T size={11.5} weight={i === 6 ? 'black' : 'semibold'} color={i === 6 ? colors.ink : colors.inkFaint}>
                  {WEEKDAY_SHORT[(d.getDay() + 6) % 7].slice(0, 2)}
                </T>
              </View>
            );
          })}
        </View>
      </Card>

      {/* reminders summary (phone app only: the web version can't schedule notifications) */}
      {!IS_WEB && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <T size={24}>🔔</T>
          <View style={{ flex: 1 }}>
            <T weight="bold" size={15}>
              {reminders.enabled ? 'Reminders on' : 'Reminders off'}
            </T>
            <T size={13} color={colors.inkSoft}>
              {!reminders.enabled
                ? 'Turn them on in the You tab'
                : reached
                  ? 'Paused for today — goal reached'
                  : nextSlot !== undefined
                    ? `Next nudge at ${String(Math.floor(nextSlot / 60)).padStart(2, '0')}:${String(nextSlot % 60).padStart(2, '0')}`
                    : 'Done for today — see you tomorrow'}
            </T>
          </View>
        </Card>
      )}

      {/* log */}
      <Animated.View layout={LinearTransition} style={{ gap: 8 }}>
        <View style={styles.logHeader}>
          <T weight="black" size={20}>
            Today
          </T>
          {t.waterEntries.length > 0 && (
            <T size={13} weight="semibold" color={colors.inkSoft}>
              {t.waterEntries.length} drink{t.waterEntries.length > 1 ? 's' : ''} · {formatLitres(t.waterMl)}
            </T>
          )}
        </View>
        {t.waterEntries.length === 0 ? (
          <T color={colors.inkSoft}>No water logged yet. Your first glass makes {petName} smile.</T>
        ) : (
          <Card style={{ paddingVertical: 6, paddingHorizontal: 14 }}>
            {(showAll ? t.waterEntries : t.waterEntries.slice(0, LOG_PREVIEW)).map((w, i) => (
              <Animated.View
                key={w.id}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition}
                style={[styles.entry, i > 0 && styles.entryDivider]}
              >
                <View style={styles.drop}>
                  <Ionicons name="water" size={18} color={colors.water} />
                </View>
                <T weight="bold" size={15} style={{ flex: 1 }}>
                  {w.ml} ml
                </T>
                <T size={13} color={colors.inkSoft}>
                  {formatTime(w.at)}
                </T>
                <Squish onPress={() => removeWater(w.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.inkFaint} />
                </Squish>
              </Animated.View>
            ))}
            {t.waterEntries.length > LOG_PREVIEW && (
              <Squish onPress={() => setShowAll((v) => !v)} style={styles.showAll}>
                <T weight="bold" size={14} color={colors.waterDeep}>
                  {showAll ? 'Show less' : `Show all ${t.waterEntries.length}`}
                </T>
                <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={16} color={colors.waterDeep} />
              </Squish>
            )}
          </Card>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card },
  glassLabel: { position: 'absolute', top: '42%', alignItems: 'center' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  goalBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.waterSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.waterSoft,
  },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingLeft: 16 },
  input: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, paddingVertical: 8 },
  addCustom: {
    backgroundColor: colors.water,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chart: { flexDirection: 'row', gap: 8, height: 130 },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: colors.waterSoft,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  entryDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  showAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  drop: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.waterSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
