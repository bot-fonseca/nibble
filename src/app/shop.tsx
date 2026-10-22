import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, enter, Squish, T, tap } from '../components/ui';
import { FREEZE_PRICE, MAX_FREEZES, useApp } from '../store';
import { colors, type Palette, radius, THEMES, themed } from '../theme';

export default function Shop() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bamboo = useApp((s) => s.bamboo);
  const freezes = useApp((s) => s.freezes);
  const ownedThemes = useApp((s) => s.ownedThemes);
  const theme = useApp((s) => s.theme);
  const { buyFreeze, buyTheme, setTheme } = useApp.getState();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 12 : insets.top + 8 }}>
      <View style={styles.header}>
        <T weight="black" size={24}>
          Panda Shop
        </T>
        <Squish onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Squish>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)}>
          <Card style={styles.balance}>
            <T size={40}>🎋</T>
            <View style={{ flex: 1 }}>
              <T weight="black" size={30} color={colors.primaryDark}>
                {bamboo}
              </T>
              <T size={13} color={colors.inkSoft}>
                Earn bamboo with daily quests and streak milestones
              </T>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(1)} style={{ gap: 10 }}>
          <T weight="black" size={18}>
            Streak protection
          </T>
          <Card style={styles.item}>
            <View style={[styles.itemIcon, { backgroundColor: colors.waterSoft }]}>
              <T size={26}>🧊</T>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="bold" size={16}>
                Streak freeze
              </T>
              <T size={13} color={colors.inkSoft}>
                Saves your streak on a day you miss your goals. Used automatically.
              </T>
              <T size={12.5} weight="bold" color={colors.waterDeep}>
                You have {freezes} / {MAX_FREEZES}
              </T>
            </View>
            <PriceButton
              price={FREEZE_PRICE}
              bamboo={bamboo}
              label={freezes >= MAX_FREEZES ? 'Full' : undefined}
              onPress={() => buyFreeze() && tap('success')}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={enter(2)} style={{ gap: 10 }}>
          <T weight="black" size={18}>
            Themes
          </T>
          {THEMES.map((th, i) => {
            const owned = ownedThemes.includes(th.id);
            const active = theme === th.id;
            const prev = THEMES[i - 1];
            const locked = !owned && !!prev && !ownedThemes.includes(prev.id);
            return (
              <Card key={th.id} style={[styles.item, locked ? { opacity: 0.6 } : {}]}>
                <ThemePreview p={th.preview} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T weight="bold" size={16}>
                    {th.name}
                  </T>
                  <T size={13} color={colors.inkSoft}>
                    {active ? 'In use' : owned ? 'Owned' : locked ? `Unlock ${prev.name} first` : `${th.price} 🎋`}
                  </T>
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                ) : locked ? (
                  <Ionicons name="lock-closed" size={22} color={colors.inkFaint} />
                ) : owned ? (
                  <Squish onPress={() => setTheme(th.id)} style={styles.useBtn}>
                    <T weight="bold" size={14} color={colors.primaryDark}>
                      Use
                    </T>
                  </Squish>
                ) : (
                  <PriceButton price={th.price} bamboo={bamboo} onPress={() => buyTheme(th.id, th.price) && tap('success')} />
                )}
              </Card>
            );
          })}
          <T size={12.5} color={colors.inkFaint}>
            Themes unlock in order. Switching theme redraws the app and takes you back to Home.
          </T>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function PriceButton({
  price,
  bamboo,
  label,
  onPress,
}: {
  price: number;
  bamboo: number;
  /** Replaces the price and disables the button, e.g. "Full". */
  label?: string;
  onPress: () => void;
}) {
  const disabled = !!label || bamboo < price;
  return (
    <Squish disabled={disabled} onPress={onPress} style={[styles.buyBtn, disabled && { opacity: 0.45 }]}>
      <T weight="black" size={14} color={colors.white}>
        {label ?? `${price} 🎋`}
      </T>
    </Squish>
  );
}

/** Mini card in the theme's own colours. */
function ThemePreview({ p }: { p: Palette }) {
  return (
    <View style={[styles.preview, { backgroundColor: p.bg, borderColor: p.line }]}>
      <View style={[styles.previewCard, { backgroundColor: p.card }]}>
        <View style={{ height: 4, width: 22, borderRadius: 2, backgroundColor: p.ink }} />
        <View style={{ height: 4, width: 30, borderRadius: 2, backgroundColor: p.primary }} />
      </View>
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
  balance: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 76,
    alignItems: 'center',
  },
  useBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  preview: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, padding: 8, justifyContent: 'center' },
  previewCard: { borderRadius: 7, padding: 5, gap: 4 },
}));
