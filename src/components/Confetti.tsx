import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const PALETTE = ['#FF8A3D', '#1FA79A', '#3A9BFF', '#F7B32B', '#F2667A', '#8E7CF0'];

/** Burst of falling confetti. Re-runs whenever `fireKey` changes (and is > 0). */
export function Confetti({ fireKey, count = 40 }: { fireKey: number; count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 140,
        delay: Math.random() * 250,
        size: 7 + Math.random() * 7,
        color: PALETTE[i % PALETTE.length],
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        round: Math.random() > 0.6,
      })),
    [fireKey, width],
  );
  if (!fireKey) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Piece key={`${fireKey}-${i}`} {...p} fall={height + 40} />
      ))}
    </View>
  );
}

function Piece(p: {
  x: number;
  drift: number;
  delay: number;
  size: number;
  color: string;
  spin: number;
  round: boolean;
  fall: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: 1800 + Math.random() * 600, easing: Easing.in(Easing.quad) }));
  }, []);
  const a = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: p.x + p.drift * t.value },
      { translateY: -30 + p.fall * t.value },
      { rotate: `${p.spin * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: p.size,
          height: p.round ? p.size : p.size * 0.45,
          borderRadius: p.round ? p.size : 2,
          backgroundColor: p.color,
        },
        a,
      ]}
    />
  );
}
