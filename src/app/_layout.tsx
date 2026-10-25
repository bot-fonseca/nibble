import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { RewardToast } from '../components/RewardToast';
import { useReminderSync } from '../lib/useReminderSync';
import { useRewards } from '../lib/useRewards';
import { useApp } from '../store';
import { applyTheme, colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
  const hydrated = useApp((s) => s.hydrated);
  // Safari (especially home-screen apps) sometimes never reports the web font as loaded, which left
  // the screen blank. On web, stop waiting after a moment: text shows in the system font and swaps
  // to Nunito as soon as it arrives.
  const [fontWaitOver, setFontWaitOver] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (fontWaitOver) return;
    const t = setTimeout(() => setFontWaitOver(true), 2500);
    return () => clearTimeout(t);
  }, [fontWaitOver]);
  const onboarded = useApp((s) => s.onboarded);
  const theme = useApp((s) => s.theme);
  const ready = (fontsLoaded || !!fontError || fontWaitOver) && hydrated;

  useReminderSync();
  useRewards();

  // swap the palette before any child renders; the key below remounts the app so every screen redraws
  applyTheme(theme);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView key={theme} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Reanimated treats Android's "transition animation scale = 0" (a common speed tweak) as
          reduce-motion and freezes everything; the pet and water are core to the app, so always animate */}
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <StatusBar style={colors.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={onboarded} redirectTo="/onboarding">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="log-meal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="streak" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="shop" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded} redirectTo="/">
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
      <RewardToast />
    </GestureHandlerRootView>
  );
}
