import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, enter, Squish, T, tap } from '../components/ui';
import { dayKey } from '../lib/dates';
import { defaultMealType, MEAL_TYPES, QUICK_FOODS, type QuickFood } from '../lib/foods';
import { type MealType, useApp } from '../store';
import { colors, fonts, radius } from '../theme';

export default function LogMeal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: MealType; day?: string }>();
  const addMeal = useApp((s) => s.addMeal);
  const petName = useApp((s) => s.petName);

  const [type, setType] = useState<MealType>(params.type ?? defaultMealType());
  const day = params.day ?? dayKey();
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const logQuick = (f: QuickFood) => {
    tap('success');
    addMeal({ type, day, name: f.name, emoji: f.emoji, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat });
    close();
  };

  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(',', '.')) || 0));
  const logCustom = () => {
    tap('success');
    addMeal({
      type,
      day,
      name: form.name.trim() || 'Meal',
      emoji: '🍽️',
      kcal: num(form.kcal),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
    });
    close();
  };

  const foods = QUICK_FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));
  const valid = num(form.kcal) > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }}
    >
      <View style={styles.header}>
        <T weight="black" size={24}>
          Feed {petName}
        </T>
        <Squish onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Squish>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {MEAL_TYPES.map((m) => (
            <Chip key={m.key} label={`${m.emoji} ${m.label}`} selected={type === m.key} onPress={() => setType(m.key)} />
          ))}
        </ScrollView>

        <Animated.View entering={enter(1)}>
          <Card style={styles.scan}>
            <View style={styles.scanIcon}>
              <Ionicons name="camera" size={26} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <T weight="bold" size={16} color={colors.white}>
                Snap a photo
              </T>
              <T size={13} color="rgba(255,255,255,0.85)">
                AI food recognition is coming soon
              </T>
            </View>
            <View style={styles.soon}>
              <T weight="black" size={11} color={colors.calories}>
                SOON
              </T>
            </View>
          </Card>
        </Animated.View>

        <View style={styles.segment}>
          {(['quick', 'custom'] as const).map((m) => (
            <Squish key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segBtnOn]}>
              <T weight="bold" size={14.5} color={mode === m ? colors.ink : colors.inkSoft}>
                {m === 'quick' ? 'Quick add' : 'Enter manually'}
              </T>
            </Squish>
          ))}
        </View>

        {mode === 'quick' ? (
          <Animated.View key="quick" entering={FadeIn} style={{ gap: 10 }}>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.inkFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search foods"
                placeholderTextColor={colors.inkFaint}
                style={styles.searchInput}
              />
            </View>
            {foods.map((f, i) => (
              <Animated.View key={f.name} entering={enter(Math.min(i, 6))}>
                <Squish onPress={() => logQuick(f)} scaleTo={0.97}>
                  <Card style={styles.food}>
                    <View style={styles.foodEmoji}>
                      <T size={24}>{f.emoji}</T>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T weight="bold" size={15.5}>
                        {f.name}
                      </T>
                      <T size={12.5} color={colors.inkSoft}>
                        {f.portion} · P {f.protein} · C {f.carbs} · F {f.fat}
                      </T>
                    </View>
                    <T weight="black" size={15} color={colors.calories}>
                      {f.kcal}
                    </T>
                    <Ionicons name="add-circle" size={26} color={colors.primary} />
                  </Card>
                </Squish>
              </Animated.View>
            ))}
            {foods.length === 0 && (
              <T color={colors.inkSoft} center style={{ marginTop: 8 }}>
                Not in the list — try “Enter manually”.
              </T>
            )}
          </Animated.View>
        ) : (
          <Animated.View key="custom" entering={FadeIn} style={{ gap: 12 }}>
            <Field label="What did you eat?" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Bifana and a coffee" />
            <Field label="Calories (kcal)" value={form.kcal} onChange={(v) => setForm({ ...form, kcal: v })} numeric placeholder="0" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Protein g" value={form.protein} onChange={(v) => setForm({ ...form, protein: v })} numeric placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Carbs g" value={form.carbs} onChange={(v) => setForm({ ...form, carbs: v })} numeric placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Fat g" value={form.fat} onChange={(v) => setForm({ ...form, fat: v })} numeric placeholder="0" />
              </View>
            </View>
            <Button title="Log meal" disabled={!valid} onPress={logCustom} style={{ marginTop: 6 }} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <T size={13} weight="semibold" color={colors.inkSoft}>
        {label}
      </T>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(numeric ? v.replace(/[^0-9.,]/g, '') : v)}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        style={styles.field}
        maxLength={numeric ? 5 : 40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scan: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.calories },
  scanIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: { backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  segment: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: radius.pill, padding: 4 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  segBtnOn: { backgroundColor: colors.card },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15.5, color: colors.ink, paddingVertical: 12 },
  food: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  foodEmoji: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
});
