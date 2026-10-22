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
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// x position (0–1 of the glass width), radius, rise duration, start delay
const BUBBLES: [number, number, number, number][] = [
  [0.36, 2.5, 3200, 0],
  [0.55, 1.8, 2600, 900],
  [0.64, 3, 3800, 1700],
  [0.45, 1.5, 2400, 2300],
  [0.58, 2.2, 3000, 400],
];

/**
 * A round drinking glass, drawn with a 3D rim and a thick base, that fills with layered,
 * rolling waves as `progress` goes from 0 to 1. Sloshes side to side whenever the level goes up.
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

  // glass geometry: a slightly tapered cylinder seen from a little above
  const cx = width / 2;
  const topW = width * 0.42; // half-width at the rim
  const botW = width * 0.32; // half-width at the base
  const rimRy = width * 0.07;
  const baseRy = width * 0.05;
  const topY = rimRy + 2;
  const botY = height * 0.9;
  const baseH = height * 0.07; // thick glass bottom
  // the water spans from just under the rim down to the top of the base
  const waterTop = topY + rimRy * 0.5;
  const waterBottom = botY - baseH;
  const amp = width * 0.028;
  const detailed = width >= 100;

  const xAt = (y: number) => {
    'worklet';
    // half-width of the glass at height y (linear taper)
    return topW + (botW - topW) * ((y - topY) / (botY - topY));
  };

  const inside = `M${cx - topW} ${topY} L${cx - botW} ${botY} A${botW} ${baseRy} 0 0 0 ${cx + botW} ${botY} L${cx + topW} ${topY} Z`;
  const rimBack = `M${cx - topW} ${topY} A${topW} ${rimRy} 0 0 1 ${cx + topW} ${topY}`;
  const rimFront = `M${cx - topW} ${topY} A${topW} ${rimRy} 0 0 0 ${cx + topW} ${topY}`;
  const sides = `M${cx - topW} ${topY} L${cx - botW} ${botY} A${botW} ${baseRy} 0 0 0 ${cx + botW} ${botY} L${cx + topW} ${topY}`;
  const baseTopY = waterBottom;
  const baseTop = `M${cx - xAt(baseTopY)} ${baseTopY} A${xAt(baseTopY)} ${baseRy} 0 0 0 ${cx + xAt(baseTopY)} ${baseTopY}`;

  // y of the water surface at x: two mixed sines plus the slosh tilt
  const surface = (x: number, lvl: number, ph: number, dir: number, a: number, off: number, tl: number) => {
    'worklet';
    const fillTop = waterTop + (waterBottom - waterTop) * (1 - lvl);
    // flatten when empty or full so the wave doesn't poke out of the glass
    const edge = Math.min(1, lvl * 12, (1 - lvl) * 12);
    const u = (x / width) * Math.PI * 2;
    const wave = a * Math.sin(u * 1.1 + dir * ph + off) + a * 0.45 * Math.sin(u * 2.3 - dir * ph * 2 + off * 1.7);
    return fillTop + (wave + tl * width * 0.08 * (x / width - 0.5)) * edge;
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
    for (let x = cx - topW * 0.7; x <= cx + topW * 0.7; x += 4) {
      d += `${d ? ' L' : 'M'}${x} ${surface(x, level.value, front.value, 1, amp, 0, tilt.value) + 2}`;
    }
    return { d, opacity: level.value > 0.02 && level.value < 0.98 ? 0.55 : 0 };
  });

  const outline = colors.waterBarSoft;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id="glass">
          <Path d={inside} />
        </ClipPath>
        <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.water} />
          <Stop offset="1" stopColor={colors.waterDeep} />
        </LinearGradient>
        <LinearGradient id="glassTint" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <Stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>

      {/* shadow on the table */}
      <Ellipse cx={cx} cy={botY + baseRy + height * 0.035} rx={botW * 1.1} ry={baseRy * 0.9} fill="#000" opacity={0.08} />

      {/* empty glass and the back of the rim */}
      <Path d={inside} fill={colors.waterSoft} />
      <Path d={rimBack} fill="none" stroke={outline} strokeWidth={2.5} />

      <G clipPath="url(#glass)">
        <AnimatedPath animatedProps={backProps} fill="#8CC5FF" />
        <AnimatedPath animatedProps={frontProps} fill="url(#water)" />
        {detailed &&
          BUBBLES.map(([x, r, duration, delay], i) => (
            <Bubble
              key={i}
              x={x * width}
              r={r * (width / 150)}
              duration={duration}
              delay={delay}
              bottom={waterBottom - 4}
              top={waterTop}
              level={level}
            />
          ))}
        <AnimatedPath animatedProps={shineProps} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />

        {/* thick glass base the water sits on */}
        <Rect x={0} y={baseTopY} width={width} height={height - baseTopY} fill={colors.waterSoft} />
        <Rect x={0} y={baseTopY} width={width} height={height - baseTopY} fill="#fff" opacity={0.35} />
        <Path d={baseTop} fill="none" stroke={outline} strokeWidth={1.5} opacity={0.8} />

        {/* curved glass sheen and reflections */}
        <Path d={inside} fill="url(#glassTint)" />
        <Rect x={cx - topW + width * 0.07} y={topY + rimRy + 6} width={width * 0.05} height={(botY - topY) * 0.55} rx={width * 0.025} fill="#fff" opacity={0.45} />
        <Rect x={cx + topW - width * 0.12} y={topY + rimRy + 14} width={width * 0.025} height={(botY - topY) * 0.3} rx={width * 0.0125} fill="#fff" opacity={0.3} />
      </G>

      {/* measuring marks at ¼, ½ and ¾ */}
      {detailed &&
        [0.25, 0.5, 0.75].map((f) => {
          const y = waterTop + (waterBottom - waterTop) * (1 - f);
          const xr = cx + xAt(y);
          return (
            <Line key={f} x1={xr - width * (f === 0.5 ? 0.1 : 0.06)} x2={xr - 4} y1={y} y2={y} stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          );
        })}

      {/* glass walls and the front of the rim */}
      <Path d={sides} fill="none" stroke={outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d={rimFront} fill="none" stroke={outline} strokeWidth={3} />
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
  level,
}: {
  x: number;
  r: number;
  duration: number;
  delay: number;
  bottom: number;
  top: number;
  level: SharedValue<number>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.in(Easing.quad) }), -1, false));
  }, []);
  const props = useAnimatedProps(() => {
    const fillTop = top + (bottom + 4 - top) * (1 - level.value);
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
