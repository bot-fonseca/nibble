import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radius, shadow } from '../theme';

/** Calm entrance for screen sections: a short fade, lightly staggered by position. */
export const enter = (i = 0) => FadeIn.duration(260).delay(i * 40);

export function tap(kind: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else Haptics.impactAsync(kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
}

export function T({
  children,
  style,
  weight = 'regular',
  size = 16,
  color = colors.ink,
  center,
  numberOfLines,
}: {
  children: ReactNode;
  style?: TextStyle | TextStyle[];
  weight?: keyof typeof fonts;
  size?: number;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts[weight], fontSize: size, color, textAlign: center ? 'center' : undefined },
        style as TextStyle,
      ]}
    >
      {children}
    </Text>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that squishes on touch. */
export function Squish({
  children,
  onPress,
  style,
  disabled,
  scaleTo = 0.95,
  haptic = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  haptic?: boolean;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => (s.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 10, stiffness: 300 }))}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      style={[a, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'soft';
  style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'soft' ? colors.primarySoft : 'transparent';
  const fg = variant === 'primary' ? colors.white : colors.primaryDark;
  return (
    <Squish
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        variant === 'primary' ? styles.btnShadow : null,
        style,
      ]}
    >
      <T weight="bold" size={18} color={fg}>
        {title}
      </T>
    </Squish>
  );
}

/** Selectable answer card used across onboarding. */
export function OptionCard({
  label,
  sub,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected]);
  const a = useAnimatedStyle(() => ({
    borderColor: interpolateColor(p.value, [0, 1], [colors.line, colors.primary]),
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.card, colors.primarySoft]),
  }));
  const check = useAnimatedStyle(() => ({ transform: [{ scale: p.value }], opacity: p.value }));
  return (
    <Squish onPress={onPress} scaleTo={0.97}>
      <Animated.View style={[styles.option, a]}>
        {emoji ? (
          <View style={styles.optionEmoji}>
            <T size={24}>{emoji}</T>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <T weight="bold" size={17}>
            {label}
          </T>
          {sub ? (
            <T size={13.5} color={colors.inkSoft} style={{ marginTop: 2 }}>
              {sub}
            </T>
          ) : null}
        </View>
        <View style={styles.radio}>
          <Animated.View style={[styles.radioDot, check]} />
        </View>
      </Animated.View>
    </Squish>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style as ViewStyle]}>{children}</View>;
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Squish
      onPress={onPress}
      style={[styles.chip, selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}]}
    >
      <T weight="semibold" size={14} color={selected ? colors.white : colors.ink}>
        {label}
      </T>
    </Squish>
  );
}

/** Animated horizontal progress bar. */
export function Bar({
  value,
  color,
  height = 8,
  track = colors.line,
}: {
  value: number;
  color: string;
  height?: number;
  track?: string;
}) {
  const [trackW, setTrackW] = useState(0);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [value]);
  // slide a full-width fill in from the left: transform-only, so it stays smooth on the UI thread
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: -trackW * (1 - p.value) }] }));
  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}
    >
      <Animated.View style={[{ width: trackW, height, borderRadius: height, backgroundColor: color }, a]} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  btnShadow: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  optionEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    ...shadow,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
});
