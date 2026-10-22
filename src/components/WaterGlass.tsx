import { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// x position (0–1 of the glass width), radius, rise duration, start delay
const BUBBLES: [number, number, number, number][] = [
  [0.32, 2.5, 3200, 0],
  [0.55, 1.8, 2600, 900],
  [0.68, 3, 3800, 1700],
  [0.44, 1.5, 2400, 2300],
  [0.6, 2.2, 3000, 400],
];

/**
 * A glass that fills with layered, rolling waves as `progress` goes from 0 to 1.
 * Sloshes side to side whenever the level goes up.
 */
export function WaterGlass({ width = 150, progress }: { width?: number; progress: number }) {
  const height = width * 1.35;
  const level = useSharedValue(0);
  const front = useSharedValue(0);
  const back = useSharedValue(0);
  const tilt = useSharedValue(0);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    front.value = withRepeat(withTiming(Math.PI * 2, { duration: 2400, easing: Easing.linear }), -1, false);
    back.value = withRepeat(withTiming(Math.PI * 2, { duration: 3700, easing: Easing.linear }), -1, false);
  }, []);
  useEffect(() => {
    const p = Math.max(0, Math.min(1, progress));
    level.value = withSpring(p, { damping: 14, stiffness: 70 });
    // tip the surface, then let an underdamped spring rock it back and forth
    if (prev.current !== null && p > prev.current) {
      tilt.value = withSequence(withTiming(1, { duration: 140 }), withSpring(0, { damping: 3, stiffness: 55 }));
    }
    prev.current = p;
  }, [progress]);

  const inset = width * 0.08;
  const top = height * 0.06;
  const glass = `M${inset} ${top} L${width - inset} ${top} L${width - inset * 2.2} ${height - 14} Q${width - inset * 2.2} ${height - 2} ${width - inset * 2.2 - 12} ${height - 2} L${inset * 2.2 + 12} ${height - 2} Q${inset * 2.2} ${height - 2} ${inset * 2.2} ${height - 14} Z`;
  const amp = width * 0.03;

  // y of the water surface at x: two mixed sines plus the slosh tilt
  const surface = (x: number, lvl: number, ph: number, dir: number, a: number, off: number, tl: number) => {
    'worklet';
    const fillTop = top + (height - top) * (1 - lvl);
    // flatten when empty or full so the wave doesn't poke out of the glass
    const edge = Math.min(1, lvl * 12, (1 - lvl) * 12);
    const u = (x / width) * Math.PI * 2;
    const wave = a * Math.sin(u * 1.1 + dir * ph + off) + a * 0.45 * Math.sin(u * 2.3 - dir * ph * 2 + off * 1.7);
    return fillTop + (wave + tl * width * 0.09 * (x / width - 0.5)) * edge;
  };

  const body = (lvl: number, ph: number, dir: number, a: number, off: number, tl: number) => {
    'worklet';
    let d = `M0 ${surface(0, lvl, ph, dir, a, off, tl)}`;
    for (let x = 4; x <= width; x += 4) d += ` L${x} ${surface(x, lvl, ph, dir, a, off, tl)}`;
    return `${d} L${width} ${height} L0 ${height} Z`;
  };

  const backProps = useAnimatedProps(() => ({
    d: body(level.value, back.value, -1, amp * 1.25, Math.PI, tilt.value * 0.7),
  }));
  const frontProps = useAnimatedProps(() => ({ d: body(level.value, front.value, 1, amp, 0, tilt.value) }));
  const shineProps = useAnimatedProps(() => {
    let d = '';
    for (let x = width * 0.12; x <= width * 0.88; x += 4) {
      d += `${d ? ' L' : 'M'}${x} ${surface(x, level.value, front.value, 1, amp, 0, tilt.value) + 2}`;
    }
    return { d, opacity: level.value > 0.02 && level.value < 0.98 ? 0.55 : 0 };
  });

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
        <AnimatedPath animatedProps={backProps} fill="#8CC5FF" />
        <AnimatedPath animatedProps={frontProps} fill="url(#water)" />
        {width >= 100 &&
          BUBBLES.map(([x, r, duration, delay], i) => (
            <Bubble
              key={i}
              x={x * width}
              r={r * (width / 150)}
              duration={duration}
              delay={delay}
              bottom={height - 8}
              top={top}
              height={height}
              level={level}
            />
          ))}
        <AnimatedPath animatedProps={shineProps} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        <Rect x={inset + 10} y={top + 14} width={8} height={height * 0.5} rx={4} fill="#fff" opacity={0.35} />
      </G>
      <Path d={glass} fill="none" stroke="#B9DBFF" strokeWidth={3} />
    </Svg>
  );
}

function Bubble({
  x,
  r,
  duration,
  delay,
  bottom,
  top,
  height,
  level,
}: {
  x: number;
  r: number;
  duration: number;
  delay: number;
  bottom: number;
  top: number;
  height: number;
  level: SharedValue<number>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.quad) }), -1, false));
  }, []);
  const props = useAnimatedProps(() => {
    const fillTop = top + (height - top) * (1 - level.value);
    const cy = bottom - t.value * (bottom - fillTop);
    // pop just before reaching the surface; hidden while the glass is (nearly) empty
    const visible = level.value > 0.08 && cy > fillTop + r * 2;
    return {
      cy,
      cx: x + Math.sin(t.value * 9 + x) * 2.5,
      opacity: visible ? 0.5 * Math.min(1, t.value * 6) : 0,
    };
  });
  return <AnimatedCircle r={r} fill="none" stroke="#fff" strokeWidth={1.2} animatedProps={props} />;
}
