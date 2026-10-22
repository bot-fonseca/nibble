import { useEffect, useId } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Text as SvgText } from 'react-native-svg';

export type Mood = 'content' | 'happy' | 'excited' | 'hungry' | 'thirsty' | 'sleepy';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);

const FUR = '#D8692C'; // rusty orange
const FUR_LIGHT = '#E88A47';
const RING = '#A9461C'; // tail rings & tear marks
const DARK = '#4A2619'; // legs, belly, ear insides
const WHITE = '#FFF8F0';
const INK = '#2A1710';
const BLUSH = '#F49A8C';

const TAIL = 'M136 186 C 170 194, 200 164, 190 122 C 186 104, 170 98, 160 110 C 170 136, 162 160, 130 168 Z';

interface Props {
  size?: number;
  mood?: Mood;
  /** Change this number to make the pet jump (e.g. after feeding it). */
  bounceKey?: number;
  style?: ViewStyle;
  idle?: boolean;
}

/**
 * The red panda mascot, drawn in SVG. Idles with a gentle breath,
 * blinks, swishes its ringed tail and jumps whenever `bounceKey` changes.
 */
export function Pet({ size = 180, mood = 'content', bounceKey = 0, style, idle = true }: Props) {
  const clipId = `tail-${useId().replace(/:/g, '')}`;
  const breath = useSharedValue(0);
  const blink = useSharedValue(1);
  const tail = useSharedValue(0);
  const jump = useSharedValue(0);
  const squash = useSharedValue(1);

  useEffect(() => {
    if (!idle) return;
    breath.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    tail.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    blink.value = withRepeat(
      withSequence(
        withDelay(4200, withTiming(0.1, { duration: 90 })),
        withTiming(1, { duration: 120 }),
        withDelay(180, withTiming(0.1, { duration: 80 })),
        withTiming(1, { duration: 110 }),
      ),
      -1,
    );
  }, [idle]);

  useEffect(() => {
    if (!bounceKey) return;
    squash.value = withSequence(
      withTiming(0.95, { duration: 120 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    jump.value = withSequence(
      withDelay(90, withTiming(-size * 0.08, { duration: 200, easing: Easing.out(Easing.quad) })),
      withSpring(0, { damping: 16, stiffness: 180 }),
    );
  }, [bounceKey]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jump.value + breath.value * -1.5 },
      { scaleY: squash.value * (1 + breath.value * 0.01) },
      { scaleX: (2 - squash.value) * (1 - breath.value * 0.006) },
    ],
  }));

  const sleepy = mood === 'sleepy';
  const eyeProps = useAnimatedProps(() => ({ ry: 8 * (sleepy ? 0.12 : blink.value) }));
  const glintProps = useAnimatedProps(() => ({ opacity: blink.value > 0.6 && !sleepy ? 1 : 0 }));
  const tailProps = useAnimatedProps(() => ({ rotation: -4 + tail.value * 8, originX: 136, originY: 178 }));

  const happyEyes = mood === 'excited' || mood === 'happy';

  return (
    <View style={[{ width: size, height: size * 1.1, alignItems: 'center' }, style]}>
      <Animated.View style={[{ width: size, height: size * 1.1, transformOrigin: 'bottom' }, bodyStyle]}>
        <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
          <Defs>
            <ClipPath id={clipId}>
              <Path d={TAIL} />
            </ClipPath>
          </Defs>
          {/* shadow */}
          <Ellipse cx={100} cy={212} rx={54} ry={6} fill="#000" opacity={0.08} />

          {/* ringed bushy tail */}
          <AnimatedG animatedProps={tailProps}>
            <Path d={TAIL} fill={FUR_LIGHT} />
            <G clipPath={`url(#${clipId})`} stroke={RING} strokeWidth={11} strokeLinecap="round">
              <Line x1={150} y1={150} x2={196} y2={162} />
              <Line x1={152} y1={124} x2={198} y2={124} />
              <Line x1={150} y1={176} x2={184} y2={200} />
              <Line x1={160} y1={100} x2={196} y2={92} />
            </G>
          </AnimatedG>

          {/* body: orange back, dark belly */}
          <Ellipse cx={100} cy={152} rx={54} ry={56} fill={FUR} />
          <Ellipse cx={100} cy={164} rx={34} ry={40} fill={DARK} />

          {/* legs & feet */}
          <Ellipse cx={74} cy={198} rx={18} ry={13} fill={DARK} />
          <Ellipse cx={126} cy={198} rx={18} ry={13} fill={DARK} />

          {/* ears: white rim, dark inside */}
          <Path d="M42 72 Q34 28 80 30 Q74 58 42 72 Z" fill={WHITE} />
          <Path d="M50 64 Q46 40 70 38 Q66 54 50 64 Z" fill={DARK} />
          <Path d="M158 72 Q166 28 120 30 Q126 58 158 72 Z" fill={WHITE} />
          <Path d="M150 64 Q154 40 130 38 Q134 54 150 64 Z" fill={DARK} />

          {/* head */}
          <Ellipse cx={100} cy={88} rx={58} ry={48} fill={FUR} />
          {/* white cheek fluff */}
          <Ellipse cx={58} cy={104} rx={20} ry={15} fill={WHITE} />
          <Ellipse cx={142} cy={104} rx={20} ry={15} fill={WHITE} />
          {/* white brow spots */}
          <Ellipse cx={76} cy={64} rx={10} ry={6.5} fill={WHITE} />
          <Ellipse cx={124} cy={64} rx={10} ry={6.5} fill={WHITE} />
          {/* tear marks */}
          <G stroke={RING} strokeWidth={9} strokeLinecap="round" opacity={0.9}>
            <Line x1={80} y1={88} x2={84} y2={104} />
            <Line x1={120} y1={88} x2={116} y2={104} />
          </G>
          {/* white muzzle */}
          <Ellipse cx={100} cy={106} rx={24} ry={17} fill={WHITE} />

          {/* eyes */}
          {happyEyes ? (
            <G stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none">
              <Path d="M69 83 Q77 73 85 83" />
              <Path d="M115 83 Q123 73 131 83" />
            </G>
          ) : (
            <G>
              <AnimatedEllipse cx={77} cy={82} rx={7.5} animatedProps={eyeProps} fill={INK} />
              <AnimatedEllipse cx={123} cy={82} rx={7.5} animatedProps={eyeProps} fill={INK} />
              <AnimatedG animatedProps={glintProps}>
                <Circle cx={79.5} cy={78.5} r={2.6} fill="#fff" />
                <Circle cx={125.5} cy={78.5} r={2.6} fill="#fff" />
              </AnimatedG>
            </G>
          )}
          {mood === 'thirsty' || mood === 'hungry' ? (
            <G stroke={RING} strokeWidth={3} strokeLinecap="round">
              <Line x1={68} y1={70} x2={84} y2={73} />
              <Line x1={132} y1={70} x2={116} y2={73} />
            </G>
          ) : null}

          {/* blush */}
          <Ellipse cx={62} cy={98} rx={8} ry={5} fill={BLUSH} opacity={0.6} />
          <Ellipse cx={138} cy={98} rx={8} ry={5} fill={BLUSH} opacity={0.6} />
          {/* nose */}
          <Path d="M92 96 Q100 92 108 96 Q104 104 100 104 Q96 104 92 96 Z" fill={INK} />
          <Mouth mood={mood} />
          {/* whiskers */}
          <G stroke="#E9D9CC" strokeWidth={1.6} strokeLinecap="round">
            <Line x1={76} y1={106} x2={50} y2={102} />
            <Line x1={76} y1={111} x2={51} y2={114} />
            <Line x1={124} y1={106} x2={150} y2={102} />
            <Line x1={124} y1={111} x2={149} y2={114} />
          </G>

          {/* dark paws */}
          <Ellipse cx={80} cy={138} rx={13} ry={10} fill={DARK} />
          <Ellipse cx={120} cy={138} rx={13} ry={10} fill={DARK} />
          <Accessory mood={mood} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const common = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'excited':
    case 'happy':
      return (
        <G>
          <Path d="M89 109 Q100 126 111 109 Z" fill={INK} />
          <Path d="M94 116 Q100 122 106 116 Q100 119 94 116 Z" fill="#F2786B" />
        </G>
      );
    case 'hungry':
      return <Ellipse cx={100} cy={114} rx={5} ry={6} fill={INK} />;
    case 'thirsty':
      return <Path d="M90 115 Q95 111 100 115 Q105 119 110 115" {...common} />;
    case 'sleepy':
      return <Path d="M94 113 L106 113" {...common} />;
    default:
      return <Path d="M90 109 Q95 115 100 109 Q105 115 110 109" {...common} />;
  }
}

function Accessory({ mood }: { mood: Mood }) {
  if (mood === 'thirsty') {
    return (
      <G>
        <Path d="M170 30 C 170 30, 160 44, 160 50 a10 10 0 0 0 20 0 C 180 44, 170 30, 170 30 Z" fill="#3A9BFF" />
        <Circle cx={166} cy={50} r={3} fill="#fff" opacity={0.7} />
        <Path d="M160 78 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" fill="#9AD0FF" />
      </G>
    );
  }
  if (mood === 'sleepy') {
    return (
      <G>
        <SvgText x={160} y={40} fontSize={22} fontWeight="900" fill="#8E7CF0">z</SvgText>
        <SvgText x={176} y={24} fontSize={16} fontWeight="900" fill="#8E7CF0" opacity={0.7}>z</SvgText>
      </G>
    );
  }
  if (mood === 'excited') {
    return (
      <G fill="#F7B32B">
        <Path d="M22 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
        <Path d="M178 18 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
      </G>
    );
  }
  if (mood === 'hungry') {
    return (
      <G>
        <Circle cx={172} cy={36} r={14} fill="#fff" stroke="#EFE4D4" strokeWidth={2} />
        <SvgText x={172} y={42} fontSize={16} textAnchor="middle">🍎</SvgText>
      </G>
    );
  }
  return null;
}
