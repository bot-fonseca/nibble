import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { Confetti } from '../../components/Confetti';
import { Pet } from '../../components/Pet';
import { MiniStepper } from '../../components/RemindersEditor';
import { Bar, Button, Card, enter, Squish, T, tap } from '../../components/ui';
import { dayKey, formatLitres, MONTHS } from '../../lib/dates';
import { buildQuests, QUEST_REWARD, type Quest } from '../../lib/quests';
import { useApp, useDayTotals, type WeightEntry } from '../../store';
import { colors, radius, themed } from '../../theme';

export default function Goals() {
  const insets = useSafeAreaInsets();
  const plan = useApp((s) => s.plan);
  const profile = useApp((s) => s.profile);
  const weights = useApp((s) => s.weights);
  const logWeight = useApp((s) => s.logWeight);
  const bamboo = useApp((s) => s.bamboo);
  const router = useRouter();
  const t = useDayTotals(dayKey());
  const [confetti, setConfetti] = useState(0);

  const quests = plan ? buildQuests(t, plan) : [];
  const doneCount = quests.filter((q) => q.done).length;

  // celebrate a quest completed while this page is open
  const prevDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > prevDone.current) {
      setConfetti((c) => c + 1);
      tap('success');
    }
    prevDone.current = doneCount;
  }, [doneCount]);

  if (!plan || !profile) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 18, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <T weight="black" size={28}>
              Goals
            </T>
            <T size={15} color={colors.inkSoft}>
              Earn 🎋 bamboo, spend it in the shop
            </T>
          </View>
          <Squish onPress={() => router.push('/shop')} scaleTo={0.92} style={styles.bambooPill}>
            <T size={18}>🎋</T>
            <T weight="black" size={16} color={colors.primaryDark}>
              {bamboo}
            </T>
            <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
          </Squish>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <Card style={{ gap: 14 }}>
            <View style={styles.questHeader}>
              <Pet size={56} mood={doneCount === quests.length ? 'excited' : 'happy'} bounceKey={confetti} />
              <View style={{ flex: 1 }}>
                <T weight="black" size={18}>
                  {doneCount === quests.length ? 'All quests done! 🎉' : 'Daily quests'}
                </T>
                <T size={13} color={colors.inkSoft}>
                  {doneCount} of {quests.length} done · resets at midnight
                </T>
              </View>
            </View>
            {quests.map((q) => (
              <QuestRow key={q.key} q={q} />
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={enter(2)}>
          <WeightCard
            start={profile.weightKg}
            target={profile.targetKg}
            changing={profile.goal === 'lose' || profile.goal === 'gain'}
            targetDate={plan.targetDate}
            weights={weights}
            onLog={(kg) => {
              logWeight(kg);
              tap('success');
            }}
          />
        </Animated.View>

        <Animated.View entering={enter(3)}>
          <Card style={{ gap: 12 }}>
            <T weight="bold" size={16}>
              Daily targets
            </T>
            <Target color={colors.calories} label="Calories" value={`${plan.calories.toLocaleString()} kcal`} />
            <Target color={colors.protein} label="Protein" value={`${plan.proteinG} g`} />
            <Target color={colors.carbs} label="Carbs" value={`${plan.carbsG} g`} />
            <Target color={colors.fat} label="Fat" value={`${plan.fatG} g`} />
            <Target color={colors.water} label="Water" value={formatLitres(plan.waterMl)} />
            <T size={12.5} color={colors.inkFaint}>
              Change your calorie and water goals in the You tab.
            </T>
          </Card>
        </Animated.View>
      </ScrollView>
      <Confetti fireKey={confetti} count={30} />
    </View>
  );
}

function QuestRow({ q }: { q: Quest }) {
  return (
    <View style={styles.quest}>
      <View style={[styles.questIcon, q.done && { backgroundColor: colors.primarySoft }]}>
        <T size={20}>{q.emoji}</T>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <T weight="bold" size={15} style={{ flex: 1 }}>
            {q.title}
          </T>
          {q.done ? (
            <Animated.View entering={ZoomIn.duration(250)}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </Animated.View>
          ) : (
            <T size={12.5} weight="bold" color={colors.inkSoft}>
              +{QUEST_REWARD} 🎋
            </T>
          )}
        </View>
        <Bar value={q.progress} color={q.over ? colors.danger : q.done ? colors.primary : colors.carbs} height={7} />
        <T size={12.5} color={q.over ? colors.danger : colors.inkSoft}>
          {q.detail}
        </T>
      </View>
    </View>
  );
}

function WeightCard({
  start,
  target,
  changing,
  targetDate,
  weights,
  onLog,
}: {
  start: number;
  target: number;
  changing: boolean;
  targetDate: number | null;
  weights: WeightEntry[];
  onLog: (kg: number) => void;
}) {
  const sorted = [...weights].sort((a, b) => a.at - b.at);
  const current = sorted.at(-1)?.kg ?? start;
  const [draft, setDraft] = useState(current);
  const loggedToday = sorted.some((w) => w.day === dayKey());

  const total = Math.abs(start - target);
  const moved = target < start ? start - current : current - start;
  const progress = total > 0 ? moved / total : 0;
  const left = Math.max(0, Number((total - moved).toFixed(1)));
  const date = targetDate ? new Date(targetDate) : null;

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.questIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="scale-outline" size={20} color={colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <T weight="bold" size={16}>
            Weight goal
          </T>
          <T size={13} color={colors.inkSoft}>
            {!changing
              ? `Keep around ${target} kg`
              : left === 0
                ? 'Target reached! 🎉'
                : `${left} kg to go${date ? ` · by ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : ''}`}
          </T>
        </View>
      </View>

      {changing && (
        <View style={{ gap: 6 }}>
          <Bar value={progress} color={colors.primary} height={10} />
          <View style={styles.weightLabels}>
            <T size={12} color={colors.inkSoft}>
              Start {start} kg
            </T>
            <T size={12} weight="bold" color={colors.ink}>
              Now {current} kg
            </T>
            <T size={12} color={colors.inkSoft}>
              Target {target} kg
            </T>
          </View>
        </View>
      )}

      {sorted.length >= 2 && <WeightChart entries={sorted.slice(-14)} target={changing ? target : null} />}

      <View style={styles.logRow}>
        <MiniStepper
          label={`${draft.toFixed(1)} kg`}
          onMinus={() => setDraft((d) => Math.max(30, Number((d - 0.1).toFixed(1))))}
          onPlus={() => setDraft((d) => Math.min(250, Number((d + 0.1).toFixed(1))))}
        />
        <Button
          title={loggedToday ? 'Update' : 'Log'}
          variant="soft"
          onPress={() => onLog(draft)}
          style={{ height: 44, paddingHorizontal: 20 }}
        />
      </View>
      {loggedToday && (
        <T size={12.5} color={colors.inkFaint}>
          Logged today. You can update it until midnight.
        </T>
      )}
    </Card>
  );
}

/** Small line chart of recent weigh-ins, with the target as a dashed line. */
function WeightChart({ entries, target }: { entries: WeightEntry[]; target: number | null }) {
  const [w, setW] = useState(0);
  const h = 90;
  const pad = 8;
  const values = entries.map((e) => e.kg);
  const lo = Math.min(...values, target ?? Infinity) - 0.5;
  const hi = Math.max(...values, target ?? -Infinity) + 0.5;
  const x = (i: number) => pad + (i / (entries.length - 1)) * (w - pad * 2);
  const y = (kg: number) => pad + (1 - (kg - lo) / (hi - lo)) * (h - pad * 2);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: h }}>
      {w > 0 && (
        <Svg width={w} height={h}>
          {target !== null && (
            <Line x1={pad} x2={w - pad} y1={y(target)} y2={y(target)} stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />
          )}
          <Polyline
            points={entries.map((e, i) => `${x(i)},${y(e.kg)}`).join(' ')}
            fill="none"
            stroke={colors.primaryDark}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {entries.map((e, i) => (
            <Circle key={e.id} cx={x(i)} cy={y(e.kg)} r={i === entries.length - 1 ? 4.5 : 3} fill={colors.primaryDark} />
          ))}
        </Svg>
      )}
    </View>
  );
}

function Target({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T color={colors.inkSoft} style={{ flex: 1 }}>
        {label}
      </T>
      <T weight="bold">{value}</T>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bambooPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  questHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
