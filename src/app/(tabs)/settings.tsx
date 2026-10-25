import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pet } from '../../components/Pet';
import { MiniStepper, RemindersEditor } from '../../components/RemindersEditor';
import { Button, Card, Chip, enter, T } from '../../components/ui';
import { formatLitres } from '../../lib/dates';
import { requestNotificationPermission } from '../../lib/notifications';
import { IS_WEB } from '../../lib/platform';
import { useApp } from '../../store';
import { colors, fonts, radius, THEMES, themed } from '../../theme';

const GOAL_LABEL = { lose: 'Lose weight', maintain: 'Maintain weight', gain: 'Gain weight', healthy: 'Eat healthier' };

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useApp((s) => s.profile);
  const plan = useApp((s) => s.plan);
  const petName = useApp((s) => s.petName);
  const glassMl = useApp((s) => s.glassMl);
  const reminders = useApp((s) => s.reminders);
  const theme = useApp((s) => s.theme);
  const ownedThemes = useApp((s) => s.ownedThemes);
  const { setCalorieGoal, setWaterGoal, setGlass, setReminders, renamePet, reset, setTheme } = useApp.getState();
  const [pet, setPet] = useState(petName);

  const confirmReset = () => {
    const run = () => {
      reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') return run();
    Alert.alert('Start over?', 'This deletes your plan, meals and water logs.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: run },
    ]);
  };

  if (!plan || !profile) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 18, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={enter(0)}>
        <T weight="black" size={28}>
          {profile.name || 'You'}
        </T>
        <T size={15} color={colors.inkSoft}>
          {GOAL_LABEL[profile.goal]} · {profile.weightKg} kg
          {profile.goal === 'lose' || profile.goal === 'gain' ? ` → ${profile.targetKg} kg` : ''}
        </T>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pet size={80} mood="happy" />
          <View style={{ flex: 1, gap: 6 }}>
            <T size={13} weight="semibold" color={colors.inkSoft}>
              Your pal’s name
            </T>
            <TextInput
              value={pet}
              onChangeText={setPet}
              onEndEditing={() => renamePet(pet.trim() || petName)}
              maxLength={14}
              style={styles.input}
            />
          </View>
        </Card>
      </Animated.View>

      <Section title="Daily goals">
        <Card style={{ gap: 16 }}>
          <Row label="Calories">
            <MiniStepper
              label={`${plan.calories}`}
              onMinus={() => setCalorieGoal(Math.max(1200, plan.calories - 50))}
              onPlus={() => setCalorieGoal(Math.min(5000, plan.calories + 50))}
            />
          </Row>
          <Row label="Water">
            <MiniStepper
              label={formatLitres(plan.waterMl)}
              onMinus={() => setWaterGoal(Math.max(1000, plan.waterMl - 250))}
              onPlus={() => setWaterGoal(Math.min(5000, plan.waterMl + 250))}
            />
          </Row>
          <View style={{ gap: 8 }}>
            <T color={colors.inkSoft}>Glass size</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[200, 250, 330, 500].map((ml) => (
                <Chip key={ml} label={`${ml} ml`} selected={glassMl === ml} onPress={() => setGlass(ml)} />
              ))}
            </View>
          </View>
          <T size={12.5} color={colors.inkFaint}>
            Macros: protein {plan.proteinG} g · carbs {plan.carbsG} g · fat {plan.fatG} g
          </T>
        </Card>
      </Section>

      <Section title="Reminders">
        {IS_WEB ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <T size={22}>🔔</T>
            <T size={14} color={colors.inkSoft} style={{ flex: 1 }}>
              Hydration reminders are only available in the Android app. On this version, use the quick-add buttons on Home.
            </T>
          </Card>
        ) : (
          <RemindersEditor
            value={reminders}
            onChange={(r) => {
              setReminders(r);
              if (r.enabled && !reminders.enabled) requestNotificationPermission();
            }}
          />
        )}
      </Section>

      <Section title="Theme">
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {THEMES.filter((th) => ownedThemes.includes(th.id)).map((th) => (
              <Chip key={th.id} label={th.name} selected={theme === th.id} onPress={() => setTheme(th.id)} />
            ))}
          </View>
          <Button title="Get more themes 🎋" variant="soft" onPress={() => router.push('/shop')} />
        </Card>
      </Section>

      <Button title="Start over" variant="ghost" onPress={confirmReset} style={{ marginTop: 8 }} />
      <T size={12} color={colors.inkFaint} center>
        All data stays on this device. Estimates are for general wellness, not medical advice.
      </T>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <T weight="black" size={18}>
        {title}
      </T>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <T color={colors.inkSoft}>{label}</T>
      {children}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  input: {
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
  },
}));
