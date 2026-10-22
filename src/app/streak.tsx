import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pet } from '../components/Pet';
import { Card, enter, Squish, T } from '../components/ui';
import { dayKey, MONTHS, WEEKDAY_SHORT, weekOf } from '../lib/dates';
import { useStreak } from '../lib/streak';
import { useApp } from '../store';
import { colors, themed } from '../theme';

export default function Streak() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const petName = useApp((s) => s.petName);
  const { won, frozen, current, longest, todayWon } = useStreak();
  const freezes = useApp((s) => s.freezes);
  const today = dayKey();
  const [monthOffset, setMonthOffset] = useState(0);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthWins = [...won].filter((d) => d.startsWith(dayKey(month).slice(0, 7))).length;

  const message =
    current === 0
      ? `Hit your goals today to start a streak with ${petName}!`
      : todayWon
        ? `Today counts! ${petName} is proud of you.`
        : `Hit today's goals to make it ${current + 1}. ${petName} believes in you!`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }}>
      <View style={styles.header}>
        <Squish onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Squish>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)}>
          <LinearGradient
            colors={current > 0 ? ['#FFB547', '#FF7A1A'] : ['#D9CFC4', '#B9AEA2']}
            style={styles.hero}
          >
            <Flame lit={current > 0} />
            <T weight="black" size={64} color={colors.white} style={{ lineHeight: 70 }}>
              {current}
            </T>
            <T weight="bold" size={18} color={colors.white}>
              day streak
            </T>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <Card style={styles.petCard}>
            <Pet size={64} mood={todayWon ? 'excited' : current > 0 ? 'happy' : 'content'} />
            <T weight="semibold" size={15} style={{ flex: 1 }}>
              {message}
            </T>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(2)}>
          <Card style={{ gap: 14 }}>
            <T weight="bold" size={16}>
              This week
            </T>
            <View style={styles.weekRow}>
              {weekOf(now).map((d, i) => {
                const k = dayKey(d);
                const isWon = won.has(k);
                const isFrozen = frozen.has(k);
                const future = k > today;
                return (
                  <View key={k} style={{ alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.weekDot,
                        isWon && { backgroundColor: colors.calories, borderColor: colors.calories },
                        isFrozen && { backgroundColor: colors.water, borderColor: colors.water },
                        k === today && !isWon && { borderColor: colors.calories },
                        future && { opacity: 0.4 },
                      ]}
                    >
                      {isWon && <Ionicons name="checkmark" size={18} color={colors.white} />}
                      {isFrozen && <Ionicons name="snow" size={16} color={colors.white} />}
                    </View>
                    <T size={12} weight={k === today ? 'black' : 'semibold'} color={k === today ? colors.ink : colors.inkFaint}>
                      {WEEKDAY_SHORT[i].slice(0, 2)}
                    </T>
                  </View>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(3)}>
          <Card style={{ gap: 12 }}>
            <View style={styles.monthHeader}>
              <Squish onPress={() => setMonthOffset((o) => Math.max(-24, o - 1))} style={styles.monthBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.ink} />
              </Squish>
              <T weight="bold" size={16}>
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </T>
              <Squish
                disabled={monthOffset === 0}
                onPress={() => setMonthOffset((o) => Math.min(0, o + 1))}
                style={[styles.monthBtn, monthOffset === 0 && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.ink} />
              </Squish>
            </View>
            <MonthGrid month={month} won={won} frozen={frozen} today={today} />
          </Card>
        </Animated.View>

        <Animated.View entering={enter(4)} style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={styles.stat}>
            <T size={24}>🏆</T>
            <T weight="black" size={22}>
              {longest} {longest === 1 ? 'day' : 'days'}
            </T>
            <T size={13} color={colors.inkSoft}>
              Longest streak
            </T>
          </Card>
          <Card style={styles.stat}>
            <T size={24}>📅</T>
            <T weight="black" size={22}>
              {monthWins} {monthWins === 1 ? 'day' : 'days'}
            </T>
            <T size={13} color={colors.inkSoft}>
              Goals hit in {MONTHS[month.getMonth()]}
            </T>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(5)}>
          <Squish onPress={() => router.push('/shop')} scaleTo={0.98}>
            <Card style={styles.freezeCard}>
              <T size={28}>🧊</T>
              <View style={{ flex: 1 }}>
                <T weight="bold" size={15}>
                  {freezes > 0 ? `${freezes} streak freeze${freezes > 1 ? 's' : ''} ready` : 'No streak freezes'}
                </T>
                <T size={13} color={colors.inkSoft}>
                  {freezes > 0 ? 'Used automatically if you miss a day' : 'Get one in the shop to protect your streak'}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </Card>
          </Squish>
        </Animated.View>

        <Animated.View entering={enter(6)}>
          <Card style={{ gap: 6, backgroundColor: colors.cardAlt, shadowOpacity: 0 }}>
            <T weight="bold" size={15}>
              How a day counts
            </T>
            <T size={14} color={colors.inkSoft}>
              Reach your water goal and eat between 80% and 110% of your calorie target. Miss a day without a streak freeze
              and it starts again from zero.
            </T>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Big flame that gently pulses while the streak is alive. */
function Flame({ lit }: { lit: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = lit
      ? withRepeat(withTiming(1.07, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(1);
  }, [lit]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[{ opacity: lit ? 1 : 0.5 }, a]}>
      <T size={84} style={{ lineHeight: 100 }}>
        🔥
      </T>
    </Animated.View>
  );
}

/** Month calendar: goal days are orange circles, and runs of them are joined by a soft band. */
function MonthGrid({ month, won, frozen, today }: { month: Date; won: Set<string>; frozen: Set<string>; today: string }) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const key = (d: number) => dayKey(new Date(y, m, d));

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.gridRow}>
        {WEEKDAY_SHORT.map((w) => (
          <T key={w} size={12} weight="bold" color={colors.inkFaint} style={styles.gridHead}>
            {w.slice(0, 1)}
          </T>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.gridRow}>
          {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
            if (d === null) return <View key={c} style={styles.cell} />;
            const k = key(d);
            const isWon = won.has(k);
            const isFrozen = frozen.has(k);
            // frozen days sit inside a streak, so they join the band too
            const inRun = (n: number) => won.has(key(n)) || frozen.has(key(n));
            const joinLeft = (isWon || isFrozen) && c > 0 && d > 1 && inRun(d - 1);
            const joinRight = (isWon || isFrozen) && c < 6 && d < days && inRun(d + 1);
            const future = k > today;
            return (
              <View key={c} style={styles.cell}>
                {joinLeft && <View style={[styles.band, { left: 0, right: '50%' }]} />}
                {joinRight && <View style={[styles.band, { left: '50%', right: 0 }]} />}
                <View
                  style={[
                    styles.dayCircle,
                    isWon && { backgroundColor: colors.calories },
                    isFrozen && { backgroundColor: colors.water },
                    k === today && !isWon && { borderWidth: 2, borderColor: colors.calories },
                  ]}
                >
                  {isFrozen ? (
                    <Ionicons name="snow" size={15} color={colors.white} />
                  ) : (
                    <T
                      size={13}
                      weight={isWon || k === today ? 'black' : 'semibold'}
                      color={isWon ? colors.white : future ? colors.inkFaint : colors.ink}
                    >
                      {d}
                    </T>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 18, paddingBottom: 8 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { borderRadius: 30, alignItems: 'center', paddingVertical: 26 },
  petCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: { flexDirection: 'row' },
  gridHead: { flex: 1, textAlign: 'center' },
  cell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 5, bottom: 5, backgroundColor: colors.streakSoft },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, gap: 2, alignItems: 'flex-start' },
  freezeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
}));
