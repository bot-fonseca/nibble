import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../../components/Confetti';
import { Pet } from '../../components/Pet';
import { Ring } from '../../components/Ring';
import { Bar, Card, Squish, T, tap } from '../../components/ui';
import { WaterGlass } from '../../components/WaterGlass';
import { addDays, dayKey, formatLitres, fromKey, greeting, prettyDate, WEEKDAY_SHORT, weekOf } from '../../lib/dates';
import { MEAL_TYPES } from '../../lib/foods';
import { petLine, petMood } from '../../lib/mood';
import { type Meal, useApp, useDayTotals } from '../../store';
import { colors, radius } from '../../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useApp((s) => s.profile);
  const plan = useApp((s) => s.plan);
  const petName = useApp((s) => s.petName);
  const glassMl = useApp((s) => s.glassMl);
  const allMeals = useApp((s) => s.meals);
  const allWater = useApp((s) => s.water);
  const addWater = useApp((s) => s.addWater);
  const removeMeal = useApp((s) => s.removeMeal);

  const today = dayKey();
  const [day, setDay] = useState(today);
  const isToday = day === today;
  const t = useDayTotals(day);

  const [bounce, setBounce] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [splash, setSplash] = useState<{ id: number; ml: number } | null>(null);

  // celebrate when a meal gets logged for the selected day
  const mealCount = useRef({ day, n: t.meals.length });
  useEffect(() => {
    const prev = mealCount.current;
    if (prev.day === day && t.meals.length > prev.n) {
      setBounce((b) => b + 1);
      setConfetti((c) => c + 1);
      tap('success');
    }
    mealCount.current = { day, n: t.meals.length };
  }, [t.meals.length, day]);

  const streak = useMemo(() => {
    const active = new Set([...allMeals.map((m) => m.day), ...allWater.map((w) => w.day)]);
    let n = 0;
    let d = new Date();
    if (!active.has(dayKey(d))) d = addDays(d, -1);
    while (active.has(dayKey(d))) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }, [allMeals, allWater]);

  // plan is cleared by "Start over" while this tab is still mounted
  if (!plan) return null;

  const mood = petMood({
    hour: new Date().getHours(),
    kcal: t.kcal,
    kcalGoal: plan.calories,
    waterMl: t.waterMl,
    waterGoal: plan.waterMl,
    mealsCount: t.meals.length,
    isToday,
  });

  const drink = (ml: number) => {
    addWater(ml, day);
    setBounce((b) => b + 1);
    setSplash({ id: Date.now(), ml });
    tap('medium');
  };

  const left = plan.calories - t.kcal;
  const name = profile?.name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 18, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <T size={15} color={colors.inkSoft}>
              {greeting()}
              {name ? ',' : ''}
            </T>
            <T weight="black" size={26} numberOfLines={1}>
              {name ? `${name} 👋` : 'Welcome back 👋'}
            </T>
          </View>
          <View style={styles.streak}>
            <T size={18}>🔥</T>
            <T weight="black" size={16} color={colors.calories}>
              {streak}
            </T>
          </View>
        </Animated.View>

        <WeekStrip selected={day} onSelect={setDay} calorieGoal={plan.calories} meals={allMeals} />

        {/* pet hero */}
        <Animated.View entering={FadeInUp.delay(80).springify().damping(14)}>
          <LinearGradient
            colors={mood === 'thirsty' ? ['#DCEEFF', '#BFE0FF'] : mood === 'sleepy' ? ['#ECE8FF', '#DAD3FF'] : ['#FFE9CF', '#FFD9B0']}
            style={styles.hero}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <T weight="black" size={13} color={colors.inkSoft} style={{ letterSpacing: 1.2 }}>
                {petName.toUpperCase()}
              </T>
              <Animated.View key={mood} entering={ZoomIn.springify().damping(12)} style={styles.bubble}>
                <T weight="semibold" size={14.5}>
                  {petLine(mood, petName, name ?? '')}
                </T>
              </Animated.View>
              {!isToday && (
                <T size={12.5} color={colors.inkSoft}>
                  Viewing {prettyDate(fromKey(day))}
                </T>
              )}
            </View>
            <Squish
              scaleTo={0.92}
              onPress={() => {
                setBounce((b) => b + 1);
                tap('medium');
              }}
            >
              <Pet size={128} mood={mood} bounceKey={bounce} />
            </Squish>
          </LinearGradient>
        </Animated.View>

        {/* calories */}
        <Animated.View entering={FadeInUp.delay(140).springify().damping(14)}>
          <Card style={styles.calCard}>
            <Ring size={150} stroke={14} progress={t.kcal / plan.calories} color={left < 0 ? colors.danger : colors.calories} track={colors.caloriesSoft}>
              <T weight="black" size={30}>
                {Math.abs(left).toLocaleString()}
              </T>
              <T size={13} color={colors.inkSoft}>
                {left < 0 ? 'kcal over' : 'kcal left'}
              </T>
            </Ring>
            <View style={{ flex: 1, gap: 14 }}>
              <Stat icon="restaurant" color={colors.calories} label="Eaten" value={`${t.kcal.toLocaleString()} kcal`} />
              <Stat icon="flag" color={colors.primary} label="Goal" value={`${plan.calories.toLocaleString()} kcal`} />
            </View>
          </Card>
        </Animated.View>

        {/* macros */}
        <Animated.View entering={FadeInUp.delay(200).springify().damping(14)} style={{ flexDirection: 'row', gap: 10 }}>
          <Macro label="Protein" value={t.protein} goal={plan.proteinG} color={colors.protein} />
          <Macro label="Carbs" value={t.carbs} goal={plan.carbsG} color={colors.carbs} />
          <Macro label="Fat" value={t.fat} goal={plan.fatG} color={colors.fat} />
        </Animated.View>

        {/* hydration */}
        <Animated.View entering={FadeInUp.delay(260).springify().damping(14)}>
          <Squish scaleTo={0.98} haptic={false} onPress={() => router.push('/water')}>
            <Card style={styles.waterCard}>
              <WaterGlass width={64} progress={t.waterMl / plan.waterMl} />
              <View style={{ flex: 1, gap: 6 }}>
                <T weight="bold" size={15} color={colors.waterDeep}>
                  Hydration
                </T>
                <T weight="black" size={22}>
                  {formatLitres(t.waterMl)}{' '}
                  <T size={15} color={colors.inkSoft}>
                    / {formatLitres(plan.waterMl)}
                  </T>
                </T>
                <Bar value={t.waterMl / plan.waterMl} color={colors.water} track={colors.waterSoft} />
              </View>
              <View style={{ gap: 8 }}>
                <Squish onPress={() => drink(glassMl)} style={styles.waterBtn}>
                  <Ionicons name="add" size={16} color={colors.white} />
                  <T weight="bold" size={13} color={colors.white}>
                    {glassMl} ml
                  </T>
                </Squish>
                <Squish onPress={() => drink(500)} style={[styles.waterBtn, { backgroundColor: colors.waterSoft }]}>
                  <Ionicons name="add" size={16} color={colors.waterDeep} />
                  <T weight="bold" size={13} color={colors.waterDeep}>
                    500 ml
                  </T>
                </Squish>
              </View>
              {splash && <FloatUp key={splash.id} text={`+${splash.ml} ml 💧`} />}
            </Card>
          </Squish>
        </Animated.View>

        {/* meals */}
        <Animated.View entering={FadeInUp.delay(320).springify().damping(14)} style={{ gap: 10 }}>
          <T weight="black" size={20} style={{ marginTop: 4 }}>
            Meals
          </T>
          {MEAL_TYPES.map((mt) => (
            <MealSection
              key={mt.key}
              label={mt.label}
              emoji={mt.emoji}
              meals={t.meals.filter((m) => m.type === mt.key)}
              onAdd={() => router.push({ pathname: '/log-meal', params: { type: mt.key, day } })}
              onRemove={removeMeal}
            />
          ))}
        </Animated.View>
      </ScrollView>
      <Confetti fireKey={confetti} count={36} />
    </View>
  );
}

function WeekStrip({
  selected,
  onSelect,
  calorieGoal,
  meals,
}: {
  selected: string;
  onSelect: (d: string) => void;
  calorieGoal: number;
  meals: Meal[];
}) {
  const days = weekOf(new Date());
  const today = dayKey();
  return (
    <Animated.View entering={FadeIn.delay(60)} style={styles.week}>
      {days.map((d, i) => {
        const k = dayKey(d);
        const sel = k === selected;
        const future = k > today;
        const kcal = meals.filter((m) => m.day === k).reduce((a, m) => a + m.kcal, 0);
        return (
          <Squish key={k} disabled={future} onPress={() => onSelect(k)} style={[styles.dayPill, sel && styles.dayPillSel]}>
            <T size={11.5} weight="bold" color={sel ? colors.white : colors.inkFaint}>
              {WEEKDAY_SHORT[i].slice(0, 1)}
            </T>
            <Ring size={30} stroke={3} progress={kcal / calorieGoal} color={sel ? colors.white : colors.calories} track={sel ? 'rgba(255,255,255,0.3)' : colors.line} duration={500}>
              <T size={12} weight="black" color={sel ? colors.white : future ? colors.inkFaint : colors.ink}>
                {d.getDate()}
              </T>
            </Ring>
          </Squish>
        );
      })}
    </Animated.View>
  );
}

function Stat({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View>
        <T size={12.5} color={colors.inkSoft}>
          {label}
        </T>
        <T weight="bold" size={16}>
          {value}
        </T>
      </View>
    </View>
  );
}

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 14, gap: 8 }}>
      <T size={12.5} weight="semibold" color={colors.inkSoft}>
        {label}
      </T>
      <T weight="black" size={17}>
        {Math.round(value)}
        <T size={12.5} color={colors.inkFaint}>
          {' '}
          / {goal}g
        </T>
      </T>
      <Bar value={value / goal} color={color} height={7} />
    </Card>
  );
}

function MealSection({
  label,
  emoji,
  meals,
  onAdd,
  onRemove,
}: {
  label: string;
  emoji: string;
  meals: Meal[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const kcal = meals.reduce((a, m) => a + m.kcal, 0);
  return (
    <Card style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.mealEmoji}>
          <T size={22}>{emoji}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T weight="bold" size={16}>
            {label}
          </T>
          <T size={13} color={colors.inkSoft}>
            {meals.length ? `${kcal} kcal · ${meals.length} item${meals.length > 1 ? 's' : ''}` : 'Nothing logged yet'}
          </T>
        </View>
        <Squish onPress={onAdd} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.primaryDark} />
        </Squish>
      </View>
      {meals.map((m) => (
        <Animated.View key={m.id} entering={FadeInDown.springify()} layout={LinearTransition} style={styles.mealItem}>
          <T size={18}>{m.emoji}</T>
          <View style={{ flex: 1 }}>
            <T weight="semibold" size={14.5} numberOfLines={1}>
              {m.name}
            </T>
            <T size={12} color={colors.inkFaint}>
              P {m.protein}g · C {m.carbs}g · F {m.fat}g
            </T>
          </View>
          <T weight="bold" size={14}>
            {m.kcal}
          </T>
          <Squish onPress={() => onRemove(m.id)} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={20} color={colors.inkFaint} />
          </Squish>
        </Animated.View>
      ))}
    </Card>
  );
}

function FloatUp({ text }: { text: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withSequence(withTiming(1, { duration: 900 }), withTiming(1.2, { duration: 200 }));
  }, []);
  const a = useAnimatedStyle(() => ({
    opacity: v.value < 1 ? 1 : Math.max(0, 1 - (v.value - 1) * 5),
    transform: [{ translateY: -46 * Math.min(v.value, 1) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.floatUp, a]}>
      <T weight="black" size={15} color={colors.waterDeep}>
        {text}
      </T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayPill: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 18,
    width: 44,
  },
  dayPillSel: { backgroundColor: colors.primary },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius.lg,
    padding: 18,
    paddingBottom: 10,
    minHeight: 168,
  },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  calCard: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  waterCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.water,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  floatUp: { position: 'absolute', right: 24, top: 10 },
  mealEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
