import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { colors, radius, shadow, themed } from '../theme';
import { T } from './ui';

/**
 * Pill that drops in at the top: "+10 🎋" when bamboo is earned, and a notice when a
 * streak freeze covered a missed day.
 */
export function RewardToast() {
  const insets = useSafeAreaInsets();
  const bamboo = useApp((s) => s.bamboo);
  const frozenCount = useApp((s) => s.frozenDays.length);
  const prevBamboo = useRef(bamboo);
  const prevFrozen = useRef(frozenCount);
  const [toast, setToast] = useState<{ id: number; text: string; ms: number } | null>(null);

  useEffect(() => {
    const diff = bamboo - prevBamboo.current;
    prevBamboo.current = bamboo;
    if (diff > 0) setToast({ id: Date.now(), text: `+${diff} 🎋`, ms: 2200 });
  }, [bamboo]);

  useEffect(() => {
    const used = frozenCount - prevFrozen.current;
    prevFrozen.current = frozenCount;
    if (used > 0) {
      setToast({
        id: Date.now(),
        text: `🧊 ${used > 1 ? `${used} streak freezes` : 'A streak freeze'} saved your streak`,
        ms: 4000,
      });
    }
  }, [frozenCount]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.ms);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Animated.View key={toast.id} entering={FadeInUp.duration(250)} exiting={FadeOutUp.duration(250)} style={styles.pill}>
        <T weight="black" size={16} color={colors.primaryDark}>
          {toast.text}
        </T>
      </Animated.View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  pill: {
    backgroundColor: colors.card,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadow,
    shadowOpacity: 0.18,
  },
}));
