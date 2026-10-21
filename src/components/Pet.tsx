import { useEffect } from 'react';
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
import Svg, { Circle, Ellipse, G, Line, Path, Text as SvgText } from 'react-native-svg';

export type Mood = 'content' | 'happy' | 'excited' | 'hungry' | 'thirsty' | 'sleepy';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);

const FUR = '#9A6A45';
const FUR_DARK = '#7B5234';
const CREAM = '#F6E2C3';
const INK = '#2E1F16';
const BLUSH = '#F49A8C';

interface Props {
  size?: number;
  mood?: Mood;
  /** Change this number to make the pet jump (e.g. after feeding it). */
  bounceKey?: number;
  style?: ViewStyle;
  idle?: boolean;
}

/**
 * The otter mascot, drawn in SVG. Idles with a gentle breath,
 * blinks, swishes its tail and jumps whenever `bounceKey` changes.
 */
export function Pet({ size = 180, mood = 'content', bounceKey = 0, style, idle = true }: Props) {
  const breath = useSharedValue(0);
  const blink = useSharedValue(1);
  const tail = useSharedValue(0);
  const jump = useSharedValue(0);
  const squash = useSharedValue(1);

  useEffect(() => {
    if (!idle) return;
    breath.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    tail.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
    blink.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(0.1, { duration: 90 })),
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
      withTiming(0.86, { duration: 110 }),
      withSpring(1, { damping: 6, stiffness: 260 }),
    );
    jump.value = withSequence(
      withDelay(90, withTiming(-size * 0.22, { duration: 220, easing: Easing.out(Easing.quad) })),
      withSpring(0, { damping: 8, stiffness: 180 }),
    );
  }, [bounceKey]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jump.value + breath.value * -3 },
      { scaleY: squash.value * (1 + breath.value * 0.018) },
      { scaleX: (2 - squash.value) * (1 - breath.value * 0.01) },
    ],
  }));

  const sleepy = mood === 'sleepy';
  const eyeProps = useAnimatedProps(() => ({ ry: 8.5 * (sleepy ? 0.12 : blink.value) }));
  const glintProps = useAnimatedProps(() => ({ opacity: blink.value > 0.6 && !sleepy ? 1 : 0 }));
  const tailProps = useAnimatedProps(() => ({ rotation: -8 + tail.value * 16, originX: 140, originY: 180 }));

  const happyEyes = mood === 'excited' || mood === 'happy';

  return (
    <View style={[{ width: size, height: size * 1.1, alignItems: 'center' }, style]}>
      <Animated.View style={[{ width: size, height: size * 1.1, transformOrigin: 'bottom' }, bodyStyle]}>
        <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
          {/* shadow */}
          <Ellipse cx={100} cy={212} rx={52} ry={6} fill="#000" opacity={0.08} />
          {/* tail */}
          <AnimatedG animatedProps={tailProps}>
            <Path d="M140 182 C 178 182, 192 150, 178 128 C 172 150, 160 164, 132 168 Z" fill={FUR_DARK} />
          </AnimatedG>
          {/* body */}
          <Ellipse cx={100} cy={150} rx={56} ry={58} fill={FUR} />
          <Ellipse cx={100} cy={160} rx={37} ry={42} fill={CREAM} />
          {/* feet */}
          <Ellipse cx={76} cy={205} rx={16} ry={8} fill={FUR_DARK} />
          <Ellipse cx={124} cy={205} rx={16} ry={8} fill={FUR_DARK} />
          {/* ears */}
          <Circle cx={53} cy={60} r={11} fill={FUR} />
          <Circle cx={147} cy={60} r={11} fill={FUR} />
          <Circle cx={52} cy={60} r={5.5} fill="#E7B48A" />
          <Circle cx={148} cy={60} r={5.5} fill="#E7B48A" />
          {/* head */}
          <Ellipse cx={100} cy={84} rx={54} ry={50} fill={FUR} />
          <Ellipse cx={100} cy={102} rx={38} ry={26} fill={CREAM} />
          <Ellipse cx={77} cy={80} rx={15} ry={14} fill={CREAM} opacity={0.55} />
          <Ellipse cx={123} cy={80} rx={15} ry={14} fill={CREAM} opacity={0.55} />
          {/* eyes */}
          {happyEyes ? (
            <G stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none">
              <Path d="M69 82 Q77 72 85 82" />
              <Path d="M115 82 Q123 72 131 82" />
            </G>
          ) : (
            <G>
              <AnimatedEllipse cx={77} cy={81} rx={7.5} animatedProps={eyeProps} fill={INK} />
              <AnimatedEllipse cx={123} cy={81} rx={7.5} animatedProps={eyeProps} fill={INK} />
              <AnimatedG animatedProps={glintProps}>
                <Circle cx={79.5} cy={77.5} r={2.6} fill="#fff" />
                <Circle cx={125.5} cy={77.5} r={2.6} fill="#fff" />
              </AnimatedG>
            </G>
          )}
          {mood === 'thirsty' || mood === 'hungry' ? (
            <G stroke={FUR_DARK} strokeWidth={3} strokeLinecap="round">
              <Line x1={68} y1={66} x2={84} y2={70} />
              <Line x1={132} y1={66} x2={116} y2={70} />
            </G>
          ) : null}
          {/* cheeks */}
          <Ellipse cx={63} cy={102} rx={9} ry={5.5} fill={BLUSH} opacity={0.55} />
          <Ellipse cx={137} cy={102} rx={9} ry={5.5} fill={BLUSH} opacity={0.55} />
          {/* nose */}
          <Path d="M92 92 Q100 88 108 92 Q104 100 100 100 Q96 100 92 92 Z" fill={INK} />
          {/* mouth */}
          <Mouth mood={mood} />
          {/* whiskers */}
          <G stroke={FUR_DARK} strokeWidth={1.6} strokeLinecap="round" opacity={0.7}>
            <Line x1={70} y1={104} x2={48} y2={100} />
            <Line x1={70} y1={109} x2={49} y2={111} />
            <Line x1={130} y1={104} x2={152} y2={100} />
            <Line x1={130} y1={109} x2={151} y2={111} />
          </G>
          {/* paws */}
          <Ellipse cx={82} cy={136} rx={12} ry={9} fill={FUR_DARK} />
          <Ellipse cx={118} cy={136} rx={12} ry={9} fill={FUR_DARK} />
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
          <Path d="M88 106 Q100 124 112 106 Z" fill={INK} />
          <Path d="M94 113 Q100 120 106 113 Q100 116 94 113 Z" fill="#F2786B" />
        </G>
      );
    case 'hungry':
      return <Ellipse cx={100} cy={111} rx={5} ry={6} fill={INK} />;
    case 'thirsty':
      return <Path d="M90 112 Q95 108 100 112 Q105 116 110 112" {...common} />;
    case 'sleepy':
      return <Path d="M94 110 L106 110" {...common} />;
    default:
      return <Path d="M90 106 Q95 112 100 106 Q105 112 110 106" {...common} />;
  }
}

function Accessory({ mood }: { mood: Mood }) {
  if (mood === 'thirsty') {
    return (
      <G>
        <Path d="M160 30 C 160 30, 150 44, 150 50 a10 10 0 0 0 20 0 C 170 44, 160 30, 160 30 Z" fill="#3A9BFF" />
        <Circle cx={156} cy={50} r={3} fill="#fff" opacity={0.7} />
        <Path d="M148 74 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" fill="#9AD0FF" />
      </G>
    );
  }
  if (mood === 'sleepy') {
    return (
      <G>
        <SvgText x={150} y={44} fontSize={22} fontWeight="900" fill="#8E7CF0">z</SvgText>
        <SvgText x={166} y={28} fontSize={16} fontWeight="900" fill="#8E7CF0" opacity={0.7}>z</SvgText>
      </G>
    );
  }
  if (mood === 'excited') {
    return (
      <G fill="#F7B32B">
        <Path d="M30 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
        <Path d="M170 22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
      </G>
    );
  }
  if (mood === 'hungry') {
    return (
      <G>
        <Circle cx={162} cy={40} r={14} fill="#fff" stroke="#EFE4D4" strokeWidth={2} />
        <SvgText x={162} y={46} fontSize={16} textAnchor="middle">🍎</SvgText>
      </G>
    );
  }
  return null;
}
