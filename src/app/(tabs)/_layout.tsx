import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Squish, T } from '../../components/ui';
import { colors, shadow } from '../../theme';

const TABS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Home', icon: 'home-outline', active: 'home' },
  water: { label: 'Water', icon: 'water-outline', active: 'water' },
  settings: { label: 'You', icon: 'person-outline', active: 'person' },
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routes = state.routes.filter((r) => TABS[r.name]);
  const items = routes.map((route) => {
    const i = state.routes.indexOf(route);
    const focused = state.index === i;
    const t = TABS[route.name];
    return (
      <Squish
        key={route.key}
        style={styles.item}
        onPress={() => {
          if (!focused) navigateToTab(route.key);
        }}
      >
        <Ionicons name={focused ? t.active : t.icon} size={24} color={focused ? colors.primary : colors.inkFaint} />
        <T size={11.5} weight={focused ? 'bold' : 'semibold'} color={focused ? colors.primary : colors.inkFaint}>
          {t.label}
        </T>
      </Squish>
    );
  });

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {/* equal halves either side of a fixed slot keep the + exactly centred */}
        <View style={styles.side}>
          {items[0]}
          {items[1]}
        </View>
        <Squish style={styles.fabWrap} scaleTo={0.9} onPress={() => router.push('/log-meal')}>
          <View style={styles.fab}>
            <Ionicons name="add" size={32} color={colors.white} />
          </View>
        </Squish>
        <View style={styles.side}>{items[2]}</View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="water" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 30,
    height: 68,
    paddingHorizontal: 8,
    ...shadow,
    shadowOpacity: 0.14,
  },
  side: { flex: 1, flexDirection: 'row', height: '100%' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%' },
  fabWrap: { width: 76, alignItems: 'center' },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -26,
    backgroundColor: colors.calories,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.bg,
    shadowColor: colors.calories,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
