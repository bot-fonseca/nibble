import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, enter, Squish, T, tap } from '../components/ui';
import { CLAUDE_PROMPT, parseClaudeMeal } from '../lib/claudeImport';
import { dayKey } from '../lib/dates';
import { defaultMealType, MEAL_TYPES, QUICK_FOODS } from '../lib/foods';
import { type FavoriteMeal, favoriteKey, type MealType, useApp } from '../store';
import { colors, fonts, radius, themed } from '../theme';

export default function LogMeal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: MealType; day?: string }>();
  const addMeal = useApp((s) => s.addMeal);
  const petName = useApp((s) => s.petName);
  const favorites = useApp((s) => s.favorites);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const favKeys = new Set(favorites.map(favoriteKey));

  const [type, setType] = useState<MealType>(params.type ?? defaultMealType());
  const day = params.day ?? dayKey();
  // open on Favorites when there are some, since those are the meals logged most
  const [mode, setMode] = useState<'favorites' | 'quick' | 'custom'>(() =>
    useApp.getState().favorites.length ? 'favorites' : 'quick',
  );
  const [saveFav, setSaveFav] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const logFood = (f: Omit<FavoriteMeal, 'id'>) => {
    tap('success');
    addMeal({ type, day, name: f.name, emoji: f.emoji, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat });
    close();
  };

  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(',', '.')) || 0));
  const logCustom = () => {
    const meal = {
      name: form.name.trim() || 'Meal',
      emoji: '🍽️',
      kcal: num(form.kcal),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
    };
    if (saveFav && !favKeys.has(favoriteKey(meal))) toggleFavorite(meal);
    logFood(meal);
  };

  const [copied, setCopied] = useState(false);
  const [claudeMsg, setClaudeMsg] = useState('');

  const askClaude = async () => {
    await Clipboard.setStringAsync(CLAUDE_PROMPT);
    setCopied(true);
    setClaudeMsg('Paste the prompt in Claude, add your photo or description, then copy Claude’s whole reply.');
    tap();
    // opens the Claude app when it's installed (Android/iOS hand claude.ai links to it), the website otherwise
    Linking.openURL('https://claude.ai/new').catch(() => {});
  };

  const pasteFromClaude = async () => {
    const meal = parseClaudeMeal(await Clipboard.getStringAsync());
    if (!meal) {
      setClaudeMsg('Couldn’t find the NIBBLE block in what you copied. Copy Claude’s full reply and try again.');
      return;
    }
    setForm({
      name: meal.name,
      kcal: String(meal.kcal),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fat: String(meal.fat),
    });
    setMode('custom');
    setClaudeMsg('Filled in from Claude. Check the numbers below, then tap Log meal.');
    tap('success');
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
          <Squish onPress={() => router.push({ pathname: '/scan', params: { type, day } })} scaleTo={0.98}>
            <Card style={styles.barcode}>
              <View style={[styles.scanIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="barcode-outline" size={26} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <T weight="bold" size={16}>
                  Scan a barcode
                </T>
                <T size={13} color={colors.inkSoft}>
                  Packaged food: calories and macros from Open Food Facts
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </Card>
          </Squish>
        </Animated.View>

        <Animated.View entering={enter(2)}>
          <Card style={styles.scan}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={styles.scanIcon}>
                <Ionicons name="sparkles" size={24} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <T weight="bold" size={16} color={colors.white}>
                  Ask Claude
                </T>
                <T size={13} color="rgba(255,255,255,0.85)">
                  Send a photo or say what you ate, then paste the answer here
                </T>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Squish onPress={askClaude} style={styles.claudeBtn}>
                <T weight="bold" size={13.5} color={colors.primaryDark} center>
                  {copied ? 'Prompt copied ✓' : '1 · Copy prompt & open'}
                </T>
              </Squish>
              <Squish onPress={pasteFromClaude} style={styles.claudeBtn}>
                <T weight="bold" size={13.5} color={colors.primaryDark} center>
                  2 · Paste answer
                </T>
              </Squish>
            </View>
            {claudeMsg ? (
              <T size={12.5} color={colors.white}>
                {claudeMsg}
              </T>
            ) : null}
          </Card>
        </Animated.View>

        <View style={styles.segment}>
          {(['favorites', 'quick', 'custom'] as const).map((m) => (
            <Squish key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segBtnOn]}>
              <T weight="bold" size={14} color={mode === m ? colors.ink : colors.inkSoft}>
                {m === 'favorites' ? '⭐ Favorites' : m === 'quick' ? 'Quick add' : 'Manual'}
              </T>
            </Squish>
          ))}
        </View>

        {mode === 'favorites' ? (
          <Animated.View key="favorites" entering={FadeIn} style={{ gap: 10 }}>
            {favorites.length === 0 ? (
              <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
                <T size={30}>⭐</T>
                <T weight="bold" size={16}>
                  No favorites yet
                </T>
                <T size={13.5} color={colors.inkSoft} center>
                  Tap ☆ on a food in Quick add or on a meal on Home, or tick “Save to favorites” when you enter one
                  manually.
                </T>
              </Card>
            ) : (
              favorites.map((f, i) => (
                <FoodRow
                  key={f.id}
                  index={i}
                  emoji={f.emoji}
                  name={f.name}
                  sub={`P ${f.protein} · C ${f.carbs} · F ${f.fat}`}
                  kcal={f.kcal}
                  fav
                  onPress={() => logFood(f)}
                  onStar={() => toggleFavorite(f)}
                />
              ))
            )}
          </Animated.View>
        ) : mode === 'quick' ? (
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
              <FoodRow
                key={f.name}
                index={i}
                emoji={f.emoji}
                name={f.name}
                sub={`${f.portion} · P ${f.protein} · C ${f.carbs} · F ${f.fat}`}
                kcal={f.kcal}
                fav={favKeys.has(favoriteKey(f))}
                onPress={() => logFood(f)}
                onStar={() => toggleFavorite(f)}
              />
            ))}
            {foods.length === 0 && (
              <T color={colors.inkSoft} center style={{ marginTop: 8 }}>
                Not in the list — try “Manual”.
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
            <Squish onPress={() => setSaveFav((v) => !v)} style={styles.favCheck}>
              <Ionicons name={saveFav ? 'star' : 'star-outline'} size={22} color={saveFav ? colors.carbs : colors.inkFaint} />
              <T weight="semibold" size={15}>
                Save to favorites
              </T>
            </Squish>
            <Button title="Log meal" disabled={!valid} onPress={logCustom} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FoodRow({
  index,
  emoji,
  name,
  sub,
  kcal,
  fav,
  onPress,
  onStar,
}: {
  index: number;
  emoji: string;
  name: string;
  sub: string;
  kcal: number;
  fav: boolean;
  onPress: () => void;
  onStar: () => void;
}) {
  return (
    <Animated.View entering={enter(Math.min(index, 6))}>
      <Squish onPress={onPress} scaleTo={0.97}>
        <Card style={styles.food}>
          <View style={styles.foodEmoji}>
            <T size={24}>{emoji}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T weight="bold" size={15.5}>
              {name}
            </T>
            <T size={12.5} color={colors.inkSoft}>
              {sub}
            </T>
          </View>
          <T weight="black" size={15} color={colors.primaryDark}>
            {kcal}
          </T>
          <Squish onPress={onStar} style={{ padding: 4 }}>
            <Ionicons name={fav ? 'star' : 'star-outline'} size={22} color={fav ? colors.carbs : colors.inkFaint} />
          </Squish>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </Card>
      </Squish>
    </Animated.View>
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

const styles = themed(() => StyleSheet.create({
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
  scan: { gap: 12, backgroundColor: colors.primary },
  barcode: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  scanIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claudeBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
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
  food: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  favCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, marginTop: 2 },
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
}));
