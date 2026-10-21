import { useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../theme';
import { T, tap } from './ui';

const TICK = 12;

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
  const [width, setWidth] = useState(0);
  const ref = useRef<ScrollViewInstance>(null);
  const last = useRef(value);
  const didInit = useRef(false);
  const count = Math.round((max - min) / step) + 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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
        <T weight="black" size={64} color={colors.ink}>
          {value.toFixed(decimals)}
        </T>
        <T weight="bold" size={22} color={colors.inkSoft} style={{ marginBottom: 14, marginLeft: 6 }}>
          {unit}
        </T>
      </View>
      <View
        style={styles.rulerWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <ScrollView
            ref={ref}
            onContentSizeChange={() => {
              if (didInit.current) return;
              didInit.current = true;
              ref.current?.scrollTo({ x: Math.round((value - min) / step) * TICK, animated: false });
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: width / 2 - 1, alignItems: 'flex-end' }}
          >
            {Array.from({ length: count }, (_, i) => {
              const major = i % 10 === 0;
              const mid = i % 5 === 0;
              return (
                <View key={i} style={{ width: TICK, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 2,
                      height: major ? 44 : mid ? 30 : 18,
                      borderRadius: 1,
                      backgroundColor: major ? colors.inkSoft : colors.inkFaint,
                      opacity: major ? 1 : 0.6,
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}
        <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 18 },
  rulerWrap: {
    height: 80,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderRadius: 22,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  needle: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 60,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
