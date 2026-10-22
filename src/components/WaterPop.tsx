import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  type SharedValue,
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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { type Mood, Pet } from './Pet';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The red panda pops up out of a pool of water, with a splash. */
export function WaterPop({
  size = 200,
  mood = 'happy',
  delay = 300,
  bounceKey,
}: {
  size?: number;
  mood?: Mood;
  delay?: number;
  bounceKey?: number;
}) {
  const width = size * 1.5;
  const rise = useSharedValue(size * 0.9);
  const splash = useSharedValue(0);
  const phase = useSharedValue(0);

  useEffect(() => {
    rise.value = withDelay(
      delay,
      withSequence(
        withTiming(size * 0.6, { duration: 250 }),
        withSpring(0, { damping: 15, stiffness: 120 }),
      ),
    );
    splash.value = withDelay(delay + 280, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1);
  }, []);

  const petStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value }] }));

  const waveH = size * 0.32;
  const waveProps = useAnimatedProps(() => {
    let d = `M0 ${waveH * 0.35}`;
    for (let x = 0; x <= width; x += 8) {
      d += ` L${x} ${waveH * 0.35 + 6 * Math.sin((x / width) * Math.PI * 3 + phase.value)}`;
    }
    return { d: `${d} L${width} ${waveH} L0 ${waveH} Z` };
  });
  const backProps = useAnimatedProps(() => {
    let d = `M0 ${waveH * 0.25}`;
    for (let x = 0; x <= width; x += 8) {
      d += ` L${x} ${waveH * 0.25 + 5 * Math.sin((x / width) * Math.PI * 3 - phase.value + 1)}`;
    }
    return { d: `${d} L${width} ${waveH} L0 ${waveH} Z` };
  });

  return (
    <View style={{ width, height: size * 1.25, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', bottom: waveH * 0.55, width, height: waveH }}>
        <Svg width={width} height={waveH}>
<Defs>
            <LinearGradient id="poolBack" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#9CD2FF" stopOpacity={0} />
              <Stop offset="0.18" stopColor="#9CD2FF" stopOpacity={1} />
              <Stop offset="0.82" stopColor="#9CD2FF" stopOpacity={1} />
              <Stop offset="1" stopColor="#9CD2FF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <AnimatedPath animatedProps={backProps} fill="url(#poolBack)" />
        </Svg>
      </View>
      <View style={{ overflow: 'hidden', width, height: size * 1.1, alignItems: 'center', marginBottom: waveH * 0.35 }}>
        <Animated.View style={petStyle}>
          <Pet size={size} mood={mood} bounceKey={bounceKey} />
        </Animated.View>
      </View>
      {[-1, -0.5, 0.5, 1].map((dir, i) => (
        <Drop key={i} dir={dir} progress={splash} bottom={waveH * 0.6} size={size} />
      ))}
      <View style={{ position: 'absolute', bottom: 0, width, height: waveH }}>
        <Svg width={width} height={waveH}>
<Defs>
            <LinearGradient id="poolFront" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#3A9BFF" stopOpacity={0} />
              <Stop offset="0.18" stopColor="#3A9BFF" stopOpacity={1} />
              <Stop offset="0.82" stopColor="#3A9BFF" stopOpacity={1} />
              <Stop offset="1" stopColor="#3A9BFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <AnimatedPath animatedProps={waveProps} fill="url(#poolFront)" />
        </Svg>
      </View>
    </View>
  );
}

function Drop({
  dir,
  progress,
  bottom,
  size,
}: {
  dir: number;
  progress: SharedValue<number>;
  bottom: number;
  size: number;
}) {
  const a = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t > 0 && t < 1 ? 1 - t * 0.9 : 0,
      transform: [
        { translateX: dir * size * 0.55 * t },
        { translateY: -size * 0.45 * Math.sin(Math.PI * t) * (1.2 - Math.abs(dir) * 0.4) },
        { scale: 1 - t * 0.4 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom,
          width: 12,
          height: 16,
          borderRadius: 8,
          borderTopLeftRadius: 2,
          backgroundColor: '#7CC2FF',
          transform: [{ rotate: '45deg' }],
        },
        a,
      ]}
    />
  );
}
