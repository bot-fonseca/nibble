import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../theme';
import { T, tap } from './ui';

const TICK = 12;
const HEIGHT = 110;
const FADE = 72;

/** Horizontal snap-scrolling ruler used for age, height and weight. */
export function Ruler({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit,
  decimals = 0,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  decimals?: number;
}) {
  // start from a screen-width estimate so the ruler draws on the first frame; onLayout corrects it
  const { width: screenW } = useWindowDimensions();
  const [width, setWidth] = useState(screenW - 44);
  const ref = useRef<ScrollViewInstance>(null);
  const last = useRef(value);
  const ready = useRef(false);
  const count = Math.round((max - min) / step) + 1;
  // frozen at mount: re-applying it while the user scrolls would fight their finger
  const [startX] = useState(() => Math.round((value - min) / step) * TICK);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // ignore the scroll events fired at offset 0 before we've positioned the ruler
    if (!ready.current) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / TICK);
    const v = Number(Math.min(max, Math.max(min, min + i * step)).toFixed(decimals));
    if (v !== last.current) {
      last.current = v;
      onChange(v);
      tap();
    }
  };

  return (
    <View>
      <View style={styles.valueRow}>
        <T weight="black" size={72} color={colors.ink} style={{ lineHeight: 80 }}>
          {value.toFixed(decimals)}
        </T>
        <T weight="bold" size={22} color={colors.inkSoft} style={{ marginBottom: 14, marginLeft: 6 }}>
          {unit}
        </T>
      </View>
      <View style={styles.rulerWrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <ScrollView
            ref={ref}
            contentOffset={{ x: startX, y: 0 }}
            onContentSizeChange={() => {
              if (ready.current) return;
              // contentOffset handles most cases; this makes sure on platforms that apply it late
              ref.current?.scrollTo({ x: startX, animated: false });
              requestAnimationFrame(() => {
                ready.current = true;
              });
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: width / 2 - 1 }}
          >
            {Array.from({ length: count }, (_, i) => {
              // major / mid ticks land on round values (e.g. every 10 years, every 5 kg)
              const k = Math.round((min + i * step) / step);
              const major = k % 10 === 0;
              const mid = k % 5 === 0;
              return (
                <View key={i} style={{ width: TICK, height: HEIGHT, justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      width: 2,
                      height: major ? 46 : mid ? 32 : 20,
                      borderRadius: 1,
                      backgroundColor: major ? colors.inkSoft : colors.inkFaint,
                      opacity: major ? 1 : 0.55,
                    }}
                  />
                  {major && (
                    <View style={styles.label}>
                      <T size={13} weight="bold" color={colors.inkFaint}>
                        {Number((min + i * step).toFixed(decimals))}
                      </T>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
        <LinearGradient
          pointerEvents="none"
          colors={[colors.bg, `${colors.bg}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, { left: 0 }]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[`${colors.bg}00`, colors.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, { right: 0 }]}
        />
        <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 2 }]}>
          <View style={styles.knob} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8 },
  rulerWrap: { height: HEIGHT },
  label: { position: 'absolute', top: 20, left: -19, width: 40, alignItems: 'center' },
  fade: { position: 'absolute', top: 0, bottom: 0, width: FADE },
  needle: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 58,
    borderRadius: 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  knob: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.bg,
  },
});
