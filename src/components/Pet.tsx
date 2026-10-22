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
const FUR_SHADE = '#B9531F'; // shadow under the head
const DARK = '#4A2619'; // legs, arms, ear insides
const WHITE = '#FFF8F0';
const INK = '#2A1710';
const BLUSH = '#F49A8C';
const OUTLINE = '#6B2E14'; // sticker-style outline

// "Sticker" chibi: big round head on a pear body, all main shapes outlined.
// Coordinates are in the 200×220 viewBox; mirrored shapes are written out for both sides.
const TAIL = 'M136 192 C176 198 198 166 186 128 C180 110 162 108 156 122 C168 146 158 170 128 176 Z';
const BODY = 'M100 118 C138 118 154 150 152 178 C150 200 130 208 100 208 C70 208 50 200 48 178 C46 150 62 118 100 118 Z';
const ARM_L = 'M62 146 C55 160 58 175 70 177 C81 177 83 166 79 154 Z';
const ARM_R = 'M138 146 C145 160 142 175 130 177 C119 177 117 166 121 154 Z';
const EAR_L = 'M44 66 C28 30 52 14 84 36 C68 44 56 54 44 66 Z';
const EAR_L_IN = 'M51 57 C42 36 58 26 75 39 C65 43 57 49 51 57 Z';
const EAR_R = 'M156 66 C172 30 148 14 116 36 C132 44 144 54 156 66 Z';
const EAR_R_IN = 'M149 57 C158 36 142 26 125 39 C135 43 143 49 149 57 Z';
const LINE = { stroke: OUTLINE, strokeWidth: 5, strokeLinejoin: 'round' as const };

// face anchors
const EYE_Y = 88;
const EYE_L = 76;
const EYE_R = 124;
const MUZZLE_Y = 112;

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
  const eyeProps = useAnimatedProps(() => ({ ry: 9.5 * (sleepy ? 0.12 : blink.value) }));
  const glintProps = useAnimatedProps(() => ({ opacity: blink.value > 0.6 && !sleepy ? 1 : 0 }));
  const tailProps = useAnimatedProps(() => ({ rotation: -4 + tail.value * 8, originX: 134, originY: 184 }));

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
          <Ellipse cx={100} cy={212} rx={50} ry={6} fill="#000" opacity={0.08} />

          {/* ringed bushy tail */}
          <AnimatedG animatedProps={tailProps}>
            <Path d={TAIL} fill={FUR_LIGHT} />
            <G clipPath={`url(#${clipId})`} stroke={RING} strokeWidth={12} strokeLinecap="round">
              <Line x1={146} y1={168} x2={166} y2={202} />
              <Line x1={160} y1={148} x2={198} y2={160} />
              <Line x1={160} y1={128} x2={196} y2={116} />
            </G>
            <Path d={TAIL} fill="none" {...LINE} />
          </AnimatedG>

          {/* body, shadow under the head, light tummy */}
          <Path d={BODY} fill={FUR} {...LINE} />
          <Ellipse cx={100} cy={140} rx={40} ry={9} fill={FUR_SHADE} opacity={0.45} />
          <Ellipse cx={100} cy={178} rx={30} ry={25} fill={FUR_LIGHT} />

          {/* feet & arms */}
          <Ellipse cx={77} cy={204} rx={17} ry={10} fill={DARK} {...LINE} />
          <Ellipse cx={123} cy={204} rx={17} ry={10} fill={DARK} {...LINE} />
          <Path d={ARM_L} fill={DARK} {...LINE} />
          <Path d={ARM_R} fill={DARK} {...LINE} />

          {/* ears: white rim, dark inside */}
          <Path d={EAR_L} fill={WHITE} {...LINE} />
          <Path d={EAR_L_IN} fill={DARK} />
          <Path d={EAR_R} fill={WHITE} {...LINE} />
          <Path d={EAR_R_IN} fill={DARK} />

          {/* head + soft highlight */}
          <Ellipse cx={100} cy={88} rx={64} ry={54} fill={FUR} {...LINE} />
          <Ellipse cx={78} cy={50} rx={22} ry={9} fill="#fff" opacity={0.14} transform="rotate(-14 78 50)" />

          {/* white brows, cheeks and muzzle, with tear marks */}
          <Ellipse cx={EYE_L - 2} cy={66} rx={10} ry={6} fill={WHITE} />
          <Ellipse cx={EYE_R + 2} cy={66} rx={10} ry={6} fill={WHITE} />
          <Ellipse cx={54} cy={108} rx={21} ry={16} fill={WHITE} />
          <Ellipse cx={146} cy={108} rx={21} ry={16} fill={WHITE} />
          <G stroke={RING} strokeWidth={8} strokeLinecap="round" opacity={0.9}>
            <Line x1={EYE_L + 2} y1={EYE_Y + 9} x2={EYE_L + 7} y2={EYE_Y + 23} />
            <Line x1={EYE_R - 2} y1={EYE_Y + 9} x2={EYE_R - 7} y2={EYE_Y + 23} />
          </G>
          <Ellipse cx={100} cy={MUZZLE_Y} rx={25} ry={17} fill={WHITE} />

          {/* eyes */}
          {happyEyes ? (
            <G stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none">
              <Path d={`M${EYE_L - 8} ${EYE_Y + 2} Q${EYE_L} ${EYE_Y - 8} ${EYE_L + 8} ${EYE_Y + 2}`} />
              <Path d={`M${EYE_R - 8} ${EYE_Y + 2} Q${EYE_R} ${EYE_Y - 8} ${EYE_R + 8} ${EYE_Y + 2}`} />
            </G>
          ) : (
            <G>
              <AnimatedEllipse cx={EYE_L} cy={EYE_Y} rx={8} animatedProps={eyeProps} fill={INK} />
              <AnimatedEllipse cx={EYE_R} cy={EYE_Y} rx={8} animatedProps={eyeProps} fill={INK} />
              <AnimatedG animatedProps={glintProps}>
                <Circle cx={EYE_L + 2.6} cy={EYE_Y - 3.6} r={3} fill="#fff" />
                <Circle cx={EYE_R + 2.6} cy={EYE_Y - 3.6} r={3} fill="#fff" />
              </AnimatedG>
            </G>
          )}
          {mood === 'thirsty' || mood === 'hungry' ? (
            <G stroke={RING} strokeWidth={3} strokeLinecap="round">
              <Line x1={EYE_L - 9} y1={69} x2={EYE_L + 7} y2={73} />
              <Line x1={EYE_R + 9} y1={69} x2={EYE_R - 7} y2={73} />
            </G>
          ) : null}

          {/* blush, nose, mouth */}
          <Ellipse cx={58} cy={EYE_Y + 15} rx={9} ry={5.5} fill={BLUSH} opacity={0.55} />
          <Ellipse cx={142} cy={EYE_Y + 15} rx={9} ry={5.5} fill={BLUSH} opacity={0.55} />
          <Path d="M93 104 Q100 100 107 104 Q104 111 100 111 Q96 111 93 104 Z" fill={INK} />
          <Mouth mood={mood} />
          <Accessory mood={mood} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const common = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' };
  const y = MUZZLE_Y + 4;
  switch (mood) {
    case 'excited':
    case 'happy':
      return (
        <G>
          <Path d={`M90 ${y} Q100 ${y + 16} 110 ${y} Z`} fill={INK} />
          <Path d={`M95 ${y + 6} Q100 ${y + 11} 105 ${y + 6} Q100 ${y + 8} 95 ${y + 6} Z`} fill="#F2786B" />
        </G>
      );
    case 'hungry':
      return <Ellipse cx={100} cy={y + 4} rx={5} ry={6} fill={INK} />;
    case 'thirsty':
      return <Path d={`M91 ${y + 4} Q95.5 ${y} 100 ${y + 4} Q104.5 ${y + 8} 109 ${y + 4}`} {...common} />;
    case 'sleepy':
      return <Path d={`M94 ${y + 3} L106 ${y + 3}`} {...common} />;
    default:
      return <Path d={`M91 ${y} Q95.5 ${y + 5} 100 ${y} Q104.5 ${y + 5} 109 ${y}`} {...common} />;
  }
}

function Accessory({ mood }: { mood: Mood }) {
  if (mood === 'thirsty') {
    return (
      <G>
        <Path d="M180 22 C 180 22, 170 36, 170 42 a10 10 0 0 0 20 0 C 190 36, 180 22, 180 22 Z" fill="#3A9BFF" />
        <Circle cx={176} cy={42} r={3} fill="#fff" opacity={0.7} />
        <Path d="M172 74 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" fill="#9AD0FF" />
      </G>
    );
  }
  if (mood === 'sleepy') {
    return (
      <G>
        <SvgText x={166} y={34} fontSize={22} fontWeight="900" fill="#8E7CF0">z</SvgText>
        <SvgText x={182} y={18} fontSize={16} fontWeight="900" fill="#8E7CF0" opacity={0.7}>z</SvgText>
      </G>
    );
  }
  if (mood === 'excited') {
    return (
      <G fill="#F7B32B">
        <Path d="M20 34 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
        <Path d="M182 14 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
      </G>
    );
  }
  if (mood === 'hungry') {
    return (
      <G>
        <Circle cx={182} cy={30} r={14} fill="#fff" stroke="#EFE4D4" strokeWidth={2} />
        <SvgText x={182} y={36} fontSize={16} textAnchor="middle">🍎</SvgText>
      </G>
    );
  }
  return null;
}
