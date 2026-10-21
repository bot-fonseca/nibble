import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A glass that fills with an animated wave as `progress` goes from 0 to 1. */
export function WaterGlass({ width = 150, progress }: { width?: number; progress: number }) {
  const height = width * 1.35;
  const level = useSharedValue(0);
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2200, easing: Easing.linear }), -1, false);
  }, []);
  useEffect(() => {
    level.value = withSpring(Math.max(0, Math.min(1, progress)), { damping: 14, stiffness: 70 });
  }, [progress]);

  const inset = width * 0.08;
  const top = height * 0.06;
  const glass = `M${inset} ${top} L${width - inset} ${top} L${width - inset * 2.2} ${height - 14} Q${width - inset * 2.2} ${height - 2} ${width - inset * 2.2 - 12} ${height - 2} L${inset * 2.2 + 12} ${height - 2} Q${inset * 2.2} ${height - 2} ${inset * 2.2} ${height - 14} Z`;

  const wave = (amp: number, offset: number, lvl: number, ph: number) => {
    'worklet';
    const fillTop = top + (height - top) * (1 - lvl);
    const a = lvl <= 0.001 || lvl >= 0.999 ? 0 : amp;
    let d = `M0 ${fillTop}`;
    for (let x = 0; x <= width; x += 6) {
      d += ` L${x} ${fillTop + a * Math.sin((x / width) * Math.PI * 2 + ph + offset)}`;
    }
    return `${d} L${width} ${height} L0 ${height} Z`;
  };

  const back = useAnimatedProps(() => ({ d: wave(5, Math.PI, level.value, phase.value) }));
  const front = useAnimatedProps(() => ({ d: wave(4, 0, level.value, phase.value) }));

  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id="glass">
          <Path d={glass} />
        </ClipPath>
        <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.water} />
          <Stop offset="1" stopColor={colors.waterDeep} />
        </LinearGradient>
      </Defs>
      <Path d={glass} fill={colors.waterSoft} />
      <G clipPath="url(#glass)">
        <AnimatedPath animatedProps={back} fill="#8CC5FF" />
        <AnimatedPath animatedProps={front} fill="url(#water)" />
        <Rect x={inset + 10} y={top + 14} width={8} height={height * 0.5} rx={4} fill="#fff" opacity={0.35} />
      </G>
      <Path d={glass} fill="none" stroke="#B9DBFF" strokeWidth={3} />
    </Svg>
  );
}
