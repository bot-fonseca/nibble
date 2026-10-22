import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  FadeOutRight,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../components/Confetti';
import { Pet } from '../components/Pet';
import { RemindersEditor } from '../components/RemindersEditor';
import { Ring } from '../components/Ring';
import { Ruler } from '../components/Ruler';
import { Bar, Button, Card, Chip, OptionCard, Squish, T, tap } from '../components/ui';
import { WaterGlass } from '../components/WaterGlass';
import { WaterPop } from '../components/WaterPop';
import { formatLitres, MONTHS } from '../lib/dates';
import { requestNotificationPermission } from '../lib/notifications';
import {
  type Activity,
  bmi,
  buildPlan,
  type Diet,
  type Goal,
  minHealthyWeight,
  type Profile,
  type Sex,
  suggestedWaterMl,
} from '../lib/plan';
import { type Reminders, useApp } from '../store';
import { colors, fonts, radius, themed } from '../theme';

type StepKey =
  | 'welcome'
  | 'name'
  | 'goal'
  | 'sex'
  | 'age'
  | 'height'
  | 'weight'
  | 'target'
  | 'pace'
  | 'activity'
  | 'progressTease'
  | 'diet'
  | 'obstacles'
  | 'obstaclesTips'
  | 'waterHabit'
  | 'waterGoal'
  | 'reminders'
  | 'adopt'
  | 'building'
  | 'plan';

const OBSTACLES = [
  { key: 'time', label: 'Not enough time', emoji: '⏱️', tip: 'Logging takes seconds — snap or tap and go.' },
  { key: 'cravings', label: 'Cravings & snacking', emoji: '🍫', tip: 'We’ll count snacks without judging them.' },
  { key: 'schedule', label: 'Busy, irregular days', emoji: '📆', tip: 'Your plan is daily, not hourly. Catch up anytime.' },
  { key: 'eatingOut', label: 'Eating out a lot', emoji: '🍔', tip: 'Quick estimates beat perfect numbers.' },
  { key: 'motivation', label: 'Staying motivated', emoji: '🔥', tip: 'Your pal cheers you on and keeps a streak.' },
  { key: 'water', label: 'Forgetting to drink water', emoji: '💧', tip: 'Gentle reminders until you hit your goal.' },
];

const PET_NAMES = ['Momo', 'Maple', 'Ember', 'Mochi', 'Biscuit', 'Noodle'];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const finish = useApp((s) => s.finishOnboarding);

  const [profile, setProfile] = useState<Profile>({
    name: '',
    goal: 'lose',
    sex: 'female',
    age: 28,
    heightCm: 168,
    weightKg: 72,
    targetKg: 66,
    paceKg: 0.5,
    activity: 'light',
    diet: 'none',
    obstacles: [],
  });
  const [touched, setTouched] = useState<Partial<Record<StepKey, boolean>>>({});
  const [waterHabit, setWaterHabit] = useState<string>('');
  const [waterGoal, setWaterGoal] = useState<number | null>(null);
  const [glassMl, setGlassMl] = useState(250);
  const [reminders, setReminders] = useState<Reminders>({
    enabled: true,
    startHour: 9,
    endHour: 21,
    everyMinutes: 120,
  });
  const [petName, setPetName] = useState('Momo');
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile((p) => ({ ...p, [k]: v }));
  const choose = <K extends keyof Profile>(step: StepKey, k: K, v: Profile[K]) => {
    set(k, v);
    setTouched((t) => ({ ...t, [step]: true }));
  };

  const changing = profile.goal === 'lose' || profile.goal === 'gain';
  const effectiveWater = waterGoal ?? suggestedWaterMl(profile.weightKg, profile.activity);

  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ['welcome', 'name', 'goal', 'sex', 'age', 'height', 'weight'];
    if (changing) s.push('target', 'pace');
    s.push(
      'activity',
      'progressTease',
      'diet',
      'obstacles',
      'obstaclesTips',
      'waterHabit',
      'waterGoal',
      'reminders',
      'adopt',
      'building',
      'plan',
    );
    return s;
  }, [changing]);

  const key = steps[index];
  const plan = useMemo(() => buildPlan(profile, effectiveWater), [profile, effectiveWater]);

  // keep the target weight sensible whenever goal / height / weight change
  useEffect(() => {
    const min = minHealthyWeight(profile.heightCm);
    if (profile.goal === 'lose') {
      const t = Math.min(profile.weightKg - 1, Math.max(min, profile.targetKg));
      if (t !== profile.targetKg && t >= min) set('targetKg', t);
    } else if (profile.goal === 'gain' && profile.targetKg <= profile.weightKg) {
      set('targetKg', profile.weightKg + 4);
    } else if (!changing) {
      set('targetKg', profile.weightKg);
    }
    if (profile.goal === 'gain' && profile.paceKg > 0.5) set('paceKg', 0.5);
  }, [profile.goal, profile.heightCm, profile.weightKg]);

  const go = (delta: number) => {
    setDir(delta);
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };
  const next = () => go(1);

  const complete = () => {
    tap('success');
    if (reminders.enabled) requestNotificationPermission().catch(() => {});
    finish({
      profile: { ...profile, name: profile.name.trim() },
      plan,
      petName: petName.trim() || 'Momo',
      glassMl,
      reminders,
    });
    router.replace('/');
  };

  const canContinue: Partial<Record<StepKey, boolean>> = {
    goal: !!touched.goal,
    sex: !!touched.sex,
    activity: !!touched.activity,
    diet: !!touched.diet,
    obstacles: profile.obstacles.length > 0,
    waterHabit: !!waterHabit,
    adopt: petName.trim().length > 0,
  };

  const chromeless = key === 'welcome' || key === 'building' || key === 'plan';
  const progress = index / (steps.length - 3);

  const content = (() => {
    switch (key) {
      case 'welcome':
        return <Welcome onStart={next} />;

      case 'name':
        return (
          <Question title="First things first — what should we call you?" sub="Your pal likes to greet you by name.">
            <TextInput
              value={profile.name}
              onChangeText={(v) => set('name', v)}
              placeholder="Your first name"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
              maxLength={24}
            />
          </Question>
        );

      case 'goal':
        return (
          <Question title="What’s your main goal?" sub="We’ll tailor your daily plan around it.">
            {(
              [
                ['lose', 'Lose weight', '🔥', 'Burn a little more than you eat'],
                ['maintain', 'Maintain weight', '⚖️', 'Keep things steady'],
                ['gain', 'Gain weight', '💪', 'Build up, healthily'],
                ['healthy', 'Just eat healthier', '🥗', 'Better habits, no scale pressure'],
              ] as [Goal, string, string, string][]
            ).map(([v, label, emoji, sub]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                sub={sub}
                selected={touched.goal === true && profile.goal === v}
                onPress={() => choose('goal', 'goal', v)}
              />
            ))}
          </Question>
        );

      case 'sex':
        return (
          <Question title="What’s your sex?" sub="Used only to estimate how much energy your body burns at rest.">
            {(
              [
                ['female', 'Female', '♀️'],
                ['male', 'Male', '♂️'],
              ] as [Sex, string, string][]
            ).map(([v, label, emoji]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                selected={touched.sex === true && profile.sex === v}
                onPress={() => choose('sex', 'sex', v)}
              />
            ))}
          </Question>
        );

      case 'age':
        return (
          <Question title="How old are you?" sub="Metabolism slows a little every decade." center>
            <Ruler min={18} max={90} value={profile.age} onChange={(v) => set('age', v)} unit="years" />
          </Question>
        );

      case 'height':
        return (
          <Question title="How tall are you?" center>
            <Ruler min={130} max={220} value={profile.heightCm} onChange={(v) => set('heightCm', v)} unit="cm" />
          </Question>
        );

      case 'weight': {
        const b = bmi(profile.weightKg, profile.heightCm);
        return (
          <Question title="What’s your current weight?" sub="Don’t worry, this stays on your phone." center>
            <Ruler
              min={35}
              max={200}
              step={0.5}
              decimals={1}
              value={profile.weightKg}
              onChange={(v) => set('weightKg', v)}
              unit="kg"
            />
            <Animated.View entering={FadeInUp.delay(200)} style={styles.infoPill}>
              <T size={14} color={colors.inkSoft}>
                Your BMI is <T weight="bold" size={14}>{b.toFixed(1)}</T>
              </T>
            </Animated.View>
          </Question>
        );
      }

      case 'target': {
        const min = minHealthyWeight(profile.heightCm);
        const lose = profile.goal === 'lose';
        const diff = Math.abs(profile.targetKg - profile.weightKg);
        return (
          <Question title="What’s your target weight?" sub={lose ? `We keep targets in a healthy range (min ${min} kg for your height).` : undefined} center>
            <Ruler
              key={`${profile.goal}-${min}`}
              min={lose ? min : profile.weightKg + 0.5}
              max={lose ? Math.max(min, profile.weightKg - 0.5) : Math.min(200, profile.weightKg + 40)}
              step={0.5}
              decimals={1}
              value={profile.targetKg}
              onChange={(v) => set('targetKg', v)}
              unit="kg"
            />
            <Animated.View entering={ZoomIn.delay(150)} style={[styles.infoPill, { backgroundColor: colors.primarySoft }]}>
              <T weight="bold" size={15} color={colors.primaryDark}>
                {lose ? 'Lose' : 'Gain'} {diff.toFixed(1)} kg — totally doable 💪
              </T>
            </Animated.View>
          </Question>
        );
      }

      case 'pace': {
        const options: [number, string, string, string][] =
          profile.goal === 'gain'
            ? [
                [0.25, 'Slow & lean', '🐢', '0.25 kg per week'],
                [0.5, 'Steady', '🐾', '0.5 kg per week · recommended'],
              ]
            : [
                [0.25, 'Slow & steady', '🐢', '0.25 kg per week'],
                [0.5, 'Balanced', '🐾', '0.5 kg per week · recommended'],
                [0.75, 'Ambitious', '🐇', '0.75 kg per week'],
                [1, 'Fast', '🐆', '1 kg per week · harder to keep up'],
              ];
        const weeks = Math.ceil(Math.abs(profile.targetKg - profile.weightKg) / profile.paceKg);
        const date = new Date(Date.now() + weeks * 7 * 86400000);
        return (
          <Question title="How fast do you want to get there?">
            {options.map(([v, label, emoji, sub]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                sub={sub}
                selected={profile.paceKg === v}
                onPress={() => set('paceKg', v)}
              />
            ))}
            <Animated.View key={profile.paceKg} entering={FadeIn} style={styles.infoPill}>
              <T size={14} color={colors.inkSoft}>
                You’d reach {profile.targetKg} kg around{' '}
                <T weight="bold" size={14}>
                  {date.getDate()} {MONTHS[date.getMonth()]} {date.getFullYear()}
                </T>
              </T>
            </Animated.View>
          </Question>
        );
      }

      case 'activity':
        return (
          <Question title="How active are you on a normal day?">
            {(
              [
                ['sedentary', 'Mostly sitting', '🪑', 'Desk job, little exercise'],
                ['light', 'Lightly active', '🚶', 'On your feet sometimes, light workouts'],
                ['active', 'Active', '🏃', 'Exercise 3–5 times a week'],
                ['very', 'Very active', '🏋️', 'Hard training or physical job'],
              ] as [Activity, string, string, string][]
            ).map(([v, label, emoji, sub]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                sub={sub}
                selected={touched.activity === true && profile.activity === v}
                onPress={() => choose('activity', 'activity', v)}
              />
            ))}
          </Question>
        );

      case 'progressTease':
        return <ProgressTease name={profile.name} />;

      case 'diet':
        return (
          <Question title="Do you follow a specific diet?">
            {(
              [
                ['none', 'No preference', '🍽️'],
                ['vegetarian', 'Vegetarian', '🥦'],
                ['vegan', 'Vegan', '🌱'],
                ['pescatarian', 'Pescatarian', '🐟'],
                ['keto', 'Keto', '🥑'],
                ['lowcarb', 'Low carb', '🥩'],
              ] as [Diet, string, string][]
            ).map(([v, label, emoji]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                selected={touched.diet === true && profile.diet === v}
                onPress={() => choose('diet', 'diet', v)}
              />
            ))}
          </Question>
        );

      case 'obstacles':
        return (
          <Question title="What usually gets in your way?" sub="Pick as many as you like.">
            {OBSTACLES.map((o) => {
              const on = profile.obstacles.includes(o.key);
              return (
                <OptionCard
                  key={o.key}
                  label={o.label}
                  emoji={o.emoji}
                  selected={on}
                  onPress={() =>
                    set('obstacles', on ? profile.obstacles.filter((x) => x !== o.key) : [...profile.obstacles, o.key])
                  }
                />
              );
            })}
          </Question>
        );

      case 'obstaclesTips':
        return (
          <Question title="Got it. Here’s how we’ll help 🙌">
            {OBSTACLES.filter((o) => profile.obstacles.includes(o.key)).map((o, i) => (
              <Animated.View key={o.key} entering={FadeInRight.delay(120 + i * 110).springify()}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                  <T size={26}>{o.emoji}</T>
                  <View style={{ flex: 1 }}>
                    <T weight="bold" size={16}>
                      {o.label}
                    </T>
                    <T size={14} color={colors.inkSoft} style={{ marginTop: 2 }}>
                      {o.tip}
                    </T>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </Question>
        );

      case 'waterHabit':
        return (
          <Question title="How much water do you drink a day?" sub="Be honest — your pal won’t judge.">
            {[
              ['low', 'Barely any', '🏜️', 'Less than 1 litre'],
              ['some', 'A bit', '🥛', '1 – 2 litres'],
              ['good', 'Quite a lot', '💧', '2 – 3 litres'],
              ['lots', 'I’m a fish', '🐟', 'More than 3 litres'],
            ].map(([v, label, emoji, sub]) => (
              <OptionCard
                key={v}
                label={label}
                emoji={emoji}
                sub={sub}
                selected={waterHabit === v}
                onPress={() => setWaterHabit(v)}
              />
            ))}
          </Question>
        );

      case 'waterGoal':
        return (
          <Question title="Your daily water goal" sub="Based on your weight and activity. Adjust if you like.">
            <View style={{ alignItems: 'center', gap: 14 }}>
              <WaterGlass width={130} progress={Math.min(1, effectiveWater / 4500)} />
              <View style={styles.stepperRow}>
                <RoundBtn icon="remove" onPress={() => setWaterGoal(Math.max(1000, effectiveWater - 250))} />
                <T weight="black" size={44}>
                  {formatLitres(effectiveWater)}
                </T>
                <RoundBtn icon="add" onPress={() => setWaterGoal(Math.min(5000, effectiveWater + 250))} />
              </View>
              <T size={14} color={colors.inkSoft}>
                Your usual glass
              </T>
              <View style={styles.chips}>
                {[200, 250, 330, 500].map((ml) => (
                  <Chip key={ml} label={`${ml} ml`} selected={glassMl === ml} onPress={() => setGlassMl(ml)} />
                ))}
              </View>
              <T size={14} color={colors.inkSoft}>
                That’s about {Math.ceil(effectiveWater / glassMl)} glasses a day.
              </T>
            </View>
          </Question>
        );

      case 'reminders':
        return <RemindersStep value={reminders} onChange={setReminders} />;

      case 'adopt':
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeInDown.delay(80)}>
                <T weight="black" size={28} center>
                  Wait… someone’s been waiting for you!
                </T>
              </Animated.View>
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <WaterPop size={170} mood="excited" delay={500} />
              </View>
              <Animated.View entering={FadeInUp.delay(1100)}>
                <T size={16} color={colors.inkSoft} center style={{ marginBottom: 14 }}>
                  Meet your new pal. Feed it by logging meals and keep it splashing by drinking water. Give it a name!
                </T>
                <TextInput
                  value={petName}
                  onChangeText={setPetName}
                  style={[styles.input, { textAlign: 'center' }]}
                  maxLength={14}
                  placeholder="Pet name"
                  placeholderTextColor={colors.inkFaint}
                />
                <View style={[styles.chips, { marginTop: 14 }]}>
                  {PET_NAMES.map((n) => (
                    <Chip key={n} label={n} selected={petName === n} onPress={() => setPetName(n)} />
                  ))}
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 'building':
        return <Building petName={petName.trim() || 'your pal'} onDone={next} />;

      case 'plan':
        return (
          <PlanReady
            name={profile.name.trim()}
            petName={petName.trim() || 'Momo'}
            plan={plan}
            profile={profile}
            onStart={complete}
          />
        );
    }
  })();

  const disabled = canContinue[key] === false;

  return (
    <View
      style={[
        styles.screen,
        key === 'welcome' ? null : { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
      ]}
    >
      {!chromeless && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <Squish onPress={() => go(-1)} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Squish>
          <View style={{ flex: 1 }}>
            <Bar value={progress} color={colors.primary} height={8} />
          </View>
        </Animated.View>
      )}

      <View style={{ flex: 1 }}>
        <Animated.View
          key={key}
          entering={(dir > 0 ? FadeInRight : FadeInLeft).duration(320)}
          exiting={(dir > 0 ? FadeOutLeft : FadeOutRight).duration(200)}
          style={StyleSheet.absoluteFill}
        >
          {content}
        </Animated.View>
      </View>

      {!chromeless && (
        <View style={styles.footer}>
          <Button
            title={key === 'adopt' ? `Adopt ${petName.trim() || 'your pal'}` : 'Continue'}
            disabled={disabled}
            onPress={next}
          />
          {key === 'name' && !profile.name.trim() ? (
            <Squish onPress={next} style={{ alignSelf: 'center', padding: 12 }}>
              <T weight="semibold" color={colors.inkSoft}>
                Skip
              </T>
            </Squish>
          ) : null}
        </View>
      )}
    </View>
  );
}

/* ---------- step building blocks ---------- */

function Question({
  title,
  sub,
  center,
  children,
}: {
  title: string;
  sub?: string;
  /** Vertically centre the content in the space below the title (used by the rulers). */
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, gap: 12 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(380)}>
        <T weight="black" size={28} style={{ lineHeight: 34 }}>
          {title}
        </T>
        {sub ? (
          <T size={16} color={colors.inkSoft} style={{ marginTop: 8 }}>
            {sub}
          </T>
        ) : null}
      </Animated.View>
      <View style={{ height: 8 }} />
      {center ? <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 40 }}>{children}</View> : children}
    </ScrollView>
  );
}

function RoundBtn({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Squish onPress={onPress} style={styles.roundBtn}>
      <Ionicons name={icon} size={26} color={colors.primaryDark} />
    </Squish>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#FFF8EE', '#FFEBD2']}
      style={{ flex: 1, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 12 }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <T weight="black" size={18} color={colors.primary} center style={{ letterSpacing: 2 }}>
            NIBBLE
          </T>
        </Animated.View>
        <WaterPop size={210} mood="happy" delay={450} />
        <Animated.View entering={FadeInUp.delay(1100).duration(500)}>
          <T weight="black" size={34} center style={{ lineHeight: 40, marginTop: 12 }}>
            Eat well, drink up,{'\n'}keep your pal happy
          </T>
          <T size={17} color={colors.inkSoft} center style={{ marginTop: 12 }}>
            Track calories, macros and water with a little red panda who’s rooting for you.
          </T>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.delay(1400)} style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
        <Button title="Get started" onPress={onStart} />
        <T size={13} color={colors.inkFaint} center style={{ marginTop: 12 }}>
          Takes about 2 minutes
        </T>
      </Animated.View>
    </LinearGradient>
  );
}

function ProgressTease({ name }: { name: string }) {
  const weeks = [0.25, 0.42, 0.6, 0.85];
  return (
    <Question
      title={`${name.trim() ? `${name.trim()}, small` : 'Small'} habits add up`}
      sub="People who log consistently tend to build habits that stick. Your pal will keep you company along the way."
    >
      <Card style={{ padding: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 170, gap: 14 }}>
          {weeks.map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Animated.View
                entering={FadeInUp.delay(250 + i * 180).springify().damping(12)}
                style={{
                  width: '100%',
                  height: `${h * 100}%`,
                  borderRadius: 14,
                  backgroundColor: i === weeks.length - 1 ? colors.primary : colors.primarySoft,
                }}
              />
              <T size={12} color={colors.inkSoft} style={{ marginTop: 8 }}>
                Week {i + 1}
              </T>
            </View>
          ))}
        </View>
      </Card>
      <Animated.View entering={ZoomIn.delay(1100)} style={{ alignItems: 'center', marginTop: 4 }}>
        <Pet size={110} mood="excited" />
      </Animated.View>
    </Question>
  );
}

function RemindersStep({ value, onChange }: { value: Reminders; onChange: (r: Reminders) => void }) {
  const [asked, setAsked] = useState<null | boolean>(null);
  return (
    <Question title="Want hydration reminders?" sub="We’ll nudge you through the day and stop once you hit your goal.">
      <RemindersEditor value={value} onChange={onChange} />
      {value.enabled && Platform.OS !== 'web' && (
        <Button
          variant="soft"
          title={asked === null ? 'Allow notifications' : asked ? 'Notifications on ✓' : 'Notifications blocked'}
          disabled={asked === true}
          onPress={async () => setAsked(await requestNotificationPermission())}
        />
      )}
      {asked === false && (
        <T size={13} color={colors.inkSoft} center>
          You can turn them on later in your phone’s settings.
        </T>
      )}
    </Question>
  );
}

function Building({ petName, onDone }: { petName: string; onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const items = [
    'Estimating your metabolism',
    'Setting your calorie target',
    'Balancing your macros',
    'Planning your hydration',
    `Getting ${petName} ready`,
  ];
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, p + 1 + Math.round(Math.random() * 2));
        if (n === 100) clearInterval(id);
        return n;
      });
    }, 55);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (pct === 100) {
      tap('success');
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [pct]);
  const doneCount = Math.floor((pct / 100) * items.length + 0.0001);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
      <Ring size={220} stroke={16} progress={pct / 100} color={colors.primary} track={colors.primarySoft} duration={120}>
        <Pet size={120} mood="content" />
      </Ring>
      <T weight="black" size={44} style={{ marginTop: 18 }}>
        {pct}%
      </T>
      <T weight="bold" size={20} center style={{ marginTop: 4 }}>
        Building your personal plan…
      </T>
      <View style={{ alignSelf: 'stretch', marginTop: 26, gap: 12 }}>
        {items.map((it, i) => {
          const done = i < doneCount;
          return (
            <View key={it} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.checkDot, done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {done && (
                  <Animated.View entering={ZoomIn.springify()}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </Animated.View>
                )}
              </View>
              <T size={16} color={done ? colors.ink : colors.inkFaint} weight={done ? 'semibold' : 'regular'}>
                {it}
              </T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PlanReady({
  name,
  petName,
  plan,
  profile,
  onStart,
}: {
  name: string;
  petName: string;
  plan: ReturnType<typeof buildPlan>;
  profile: Profile;
  onStart: () => void;
}) {
  const [fire, setFire] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFire(1), 250);
    return () => clearTimeout(t);
  }, []);
  const target = plan.targetDate ? new Date(plan.targetDate) : null;
  const macros = [
    { label: 'Protein', g: plan.proteinG, color: colors.protein },
    { label: 'Carbs', g: plan.carbsG, color: colors.carbs },
    { label: 'Fat', g: plan.fatG, color: colors.fat },
  ];
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 10, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.springify().damping(11)} style={{ alignItems: 'center' }}>
          <Pet size={130} mood="excited" bounceKey={fire} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)}>
          <T weight="black" size={28} center>
            {name ? `${name}, your plan is ready!` : 'Your plan is ready!'}
          </T>
          {target && (
            <T size={16} color={colors.inkSoft} center style={{ marginTop: 6 }}>
              Reach {profile.targetKg} kg by{' '}
              <T weight="bold" size={16} color={colors.primaryDark}>
                {target.getDate()} {MONTHS[target.getMonth()]} {target.getFullYear()}
              </T>
            </T>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Card style={{ alignItems: 'center', gap: 4 }}>
            <T size={14} color={colors.inkSoft}>
              Daily calories
            </T>
            <T weight="black" size={46} color={colors.calories}>
              {plan.calories.toLocaleString()}
            </T>
            <T size={13} color={colors.inkFaint}>
              kcal · maintenance is about {plan.tdee.toLocaleString()}
            </T>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(420).springify()} style={{ flexDirection: 'row', gap: 10 }}>
          {macros.map((m) => (
            <Card key={m.label} style={{ flex: 1, alignItems: 'center', padding: 14 }}>
              <Ring size={64} stroke={7} progress={1} color={m.color} track={colors.line}>
                <T weight="black" size={15}>
                  {m.g}g
                </T>
              </Ring>
              <T weight="semibold" size={13} color={colors.inkSoft} style={{ marginTop: 6 }}>
                {m.label}
              </T>
            </Card>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(540).springify()}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.waterSoft }}>
            <T size={30}>💧</T>
            <View style={{ flex: 1 }}>
              <T weight="black" size={20} color={colors.waterDeep}>
                {formatLitres(plan.waterMl)} of water
              </T>
              <T size={13.5} color={colors.inkSoft}>
                every day, with reminders to keep {petName} splashing
              </T>
            </View>
          </Card>
        </Animated.View>

        <T size={12} color={colors.inkFaint} center style={{ marginTop: 4 }}>
          Estimates for general wellness, not medical advice. Check with a doctor before big diet changes.
        </T>
      </ScrollView>
      <Animated.View entering={FadeInUp.delay(700)} style={{ paddingHorizontal: 22 }}>
        <Button title="Start my journey" onPress={onStart} />
      </Animated.View>
      <Confetti fireKey={fire} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 6 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: 22, paddingTop: 8 },
  input: {
    height: 62,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 18,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  infoPill: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  roundBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
