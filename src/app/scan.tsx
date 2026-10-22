import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniStepper } from '../components/RemindersEditor';
import { Button, Card, Chip, Squish, T, tap } from '../components/ui';
import { dayKey } from '../lib/dates';
import { defaultMealType } from '../lib/foods';
import { fetchProduct, forGrams, type Product } from '../lib/openFoodFacts';
import { favoriteKey, type MealType, useApp } from '../store';
import { colors, radius, themed } from '../theme';

type Phase = { kind: 'scanning' } | { kind: 'loading'; code: string } | { kind: 'found'; product: Product } | { kind: 'missing'; code: string } | { kind: 'offline' };

export default function Scan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: MealType; day?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  // the camera reports the same code many times a second; only handle the first one
  const busy = useRef(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onScanned = async ({ data }: BarcodeScanningResult) => {
    if (busy.current) return;
    busy.current = true;
    tap('medium');
    setPhase({ kind: 'loading', code: data });
    try {
      const product = await fetchProduct(data);
      setPhase(product ? { kind: 'found', product } : { kind: 'missing', code: data });
    } catch {
      setPhase({ kind: 'offline' });
    }
  };

  const scanAgain = () => {
    busy.current = false;
    setPhase({ kind: 'scanning' });
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Squish onPress={close} style={[styles.close, { top: insets.top + 8 }]}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Squish>
        <T size={48}>📷</T>
        <T weight="black" size={22} center>
          Scan food barcodes
        </T>
        <T size={15} color={colors.inkSoft} center>
          Nibble needs your camera to read the barcode on a package. Photos aren’t taken or saved.
        </T>
        {permission.canAskAgain ? (
          <Button title="Allow camera" onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
        ) : (
          <Button title="Open settings" onPress={() => Linking.openSettings()} style={{ alignSelf: 'stretch' }} />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={phase.kind === 'scanning' ? onScanned : undefined}
      />

      <View pointerEvents="none" style={styles.frameWrap}>
        <View style={styles.frame} />
        <T weight="bold" size={15} color="#fff" center style={{ marginTop: 18 }}>
          {phase.kind === 'loading' ? 'Looking it up…' : 'Point at the barcode on the package'}
        </T>
        {phase.kind === 'loading' && <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />}
      </View>

      <Squish onPress={close} style={[styles.close, { top: insets.top + 8 }]}>
        <Ionicons name="close" size={22} color={colors.ink} />
      </Squish>

      {(phase.kind === 'found' || phase.kind === 'missing' || phase.kind === 'offline') && (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {phase.kind === 'found' ? (
            <ProductSheet
              product={phase.product}
              type={params.type}
              day={params.day ?? dayKey()}
              onLogged={() => router.dismissAll()}
              onScanAgain={scanAgain}
            />
          ) : (
            <View style={{ gap: 12 }}>
              <T weight="black" size={19}>
                {phase.kind === 'offline' ? 'Couldn’t connect' : 'Product not found'}
              </T>
              <T size={14.5} color={colors.inkSoft}>
                {phase.kind === 'offline'
                  ? 'Check your internet connection and try again.'
                  : `Barcode ${phase.code} isn’t in the Open Food Facts database yet. Take a photo of the nutrition label and use Ask Claude instead.`}
              </T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Scan again" variant="soft" onPress={scanAgain} style={{ flex: 1 }} />
                {phase.kind === 'missing' && <Button title="Ask Claude" onPress={close} style={{ flex: 1 }} />}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

function ProductSheet({
  product,
  type,
  day,
  onLogged,
  onScanAgain,
}: {
  product: Product;
  type?: MealType;
  day: string;
  onLogged: () => void;
  onScanAgain: () => void;
}) {
  const addMeal = useApp((s) => s.addMeal);
  const favorites = useApp((s) => s.favorites);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const hasServing = product.servingG !== null;
  const [unit, setUnit] = useState<'serving' | 'g'>(hasServing ? 'serving' : 'g');
  const [servings, setServings] = useState(1);
  const [grams, setGrams] = useState(product.servingG ?? 100);
  const [saveFav, setSaveFav] = useState(false);

  const totalG = unit === 'serving' && product.servingG ? servings * product.servingG : grams;
  const n = forGrams(product, totalG);
  const amountLabel = unit === 'serving' ? `${servings} serving${servings === 1 ? '' : 's'}` : `${grams} g`;
  const meal = { name: `${product.name} · ${amountLabel}`.slice(0, 40), emoji: '🛒', ...n };

  const log = () => {
    if (saveFav && !favorites.some((f) => favoriteKey(f) === favoriteKey(meal))) toggleFavorite(meal);
    addMeal({ ...meal, type: type ?? defaultMealType(), day });
    tap('success');
    onLogged();
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.thumb}>
          {product.image ? <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : <T size={28}>🛒</T>}
        </View>
        <View style={{ flex: 1 }}>
          <T weight="black" size={18} numberOfLines={2}>
            {product.name}
          </T>
          <T size={13} color={colors.inkSoft}>
            {[product.brand, `${Math.round(product.per100.kcal)} kcal / 100 g`].filter(Boolean).join(' · ')}
          </T>
        </View>
      </View>

      {hasServing && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label={`Servings${product.servingLabel ? ` (${product.servingLabel})` : ''}`} selected={unit === 'serving'} onPress={() => setUnit('serving')} />
          <Chip label="Grams" selected={unit === 'g'} onPress={() => setUnit('g')} />
        </View>
      )}

      <View style={styles.amountRow}>
        <T color={colors.inkSoft}>How much?</T>
        {unit === 'serving' ? (
          <MiniStepper
            label={`${servings}`}
            onMinus={() => setServings((s) => Math.max(0.5, s - 0.5))}
            onPlus={() => setServings((s) => Math.min(20, s + 0.5))}
          />
        ) : (
          <MiniStepper
            label={`${grams} g`}
            onMinus={() => setGrams((g) => Math.max(5, g - 10))}
            onPlus={() => setGrams((g) => Math.min(2000, g + 10))}
          />
        )}
      </View>
      {unit === 'g' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[30, 50, 100, 150, 250].map((g) => (
            <Chip key={g} label={`${g} g`} selected={grams === g} onPress={() => setGrams(g)} />
          ))}
        </View>
      )}

      <Card style={styles.totals}>
        <Total label="kcal" value={n.kcal} color={colors.primaryDark} />
        <Total label="protein" value={`${n.protein}g`} color={colors.protein} />
        <Total label="carbs" value={`${n.carbs}g`} color={colors.carbs} />
        <Total label="fat" value={`${n.fat}g`} color={colors.fat} />
      </Card>

      <Squish onPress={() => setSaveFav((v) => !v)} style={styles.favCheck}>
        <Ionicons name={saveFav ? 'star' : 'star-outline'} size={22} color={saveFav ? colors.carbs : colors.inkFaint} />
        <T weight="semibold" size={15}>
          Save to favorites
        </T>
      </Squish>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Scan again" variant="soft" onPress={onScanAgain} style={{ flex: 1 }} />
        <Button title="Log it" onPress={log} disabled={n.kcal <= 0} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

function Total({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T weight="black" size={18} color={color}>
        {value}
      </T>
      <T size={12} color={colors.inkSoft}>
        {label}
      </T>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 28,
  },
  close: {
    position: 'absolute',
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  frame: { width: 270, height: 170, borderRadius: 22, borderWidth: 3, borderColor: '#fff' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totals: { flexDirection: 'row', paddingVertical: 14 },
  favCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
}));
