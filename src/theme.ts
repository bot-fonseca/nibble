export type ThemeId = 'classic' | 'ocean' | 'matcha' | 'night';

const classic = {
  bg: '#FFF8EE',
  card: '#FFFFFF',
  cardAlt: '#FFF1DE',
  ink: '#2B2118',
  inkSoft: '#6E6255',
  inkFaint: '#A89C8F',
  line: '#EFE4D4',
  primary: '#1FA79A',
  primaryDark: '#158377',
  primarySoft: '#D9F3EF',
  calories: '#FF8A3D',
  caloriesSoft: '#FFE6D4',
  protein: '#F2667A',
  carbs: '#F7B32B',
  fat: '#8E7CF0',
  water: '#3A9BFF',
  waterDeep: '#1E6FD9',
  waterSoft: '#DCEEFF',
  waterBarSoft: '#9CCBFF',
  danger: '#E5484D',
  white: '#FFFFFF',
  /** pet speech bubble */
  bubble: '#FFFFFF',
  /** band joining streak days on the calendar */
  streakSoft: '#FFE1C7',
  heroWarm: ['#FFE9CF', '#FFD9B0'] as [string, string],
  heroWater: ['#DCEEFF', '#BFE0FF'] as [string, string],
  heroSleepy: ['#ECE8FF', '#DAD3FF'] as [string, string],
  statusBar: 'dark' as 'dark' | 'light',
};

export type Palette = typeof classic;

const PALETTES: Record<ThemeId, Palette> = {
  classic,
  ocean: {
    ...classic,
    bg: '#F1F7FB',
    cardAlt: '#E3F0F8',
    ink: '#14212B',
    inkSoft: '#526573',
    inkFaint: '#93A4B0',
    line: '#DCE8F0',
    primary: '#2A7FD4',
    primaryDark: '#1F63A8',
    primarySoft: '#DCEBFA',
    heroWarm: ['#DDEFFB', '#C4E2F7'],
  },
  matcha: {
    ...classic,
    bg: '#F5F8EE',
    cardAlt: '#EAF1DC',
    ink: '#1F2717',
    inkSoft: '#5D6B4F',
    inkFaint: '#9DA88F',
    line: '#E2EAD3',
    primary: '#5A9A3C',
    primaryDark: '#457A2C',
    primarySoft: '#E2F0D6',
    heroWarm: ['#E6F2D5', '#D3E8BC'],
  },
  night: {
    ...classic,
    bg: '#16120E',
    card: '#221C16',
    cardAlt: '#2D251D',
    ink: '#F5ECE1',
    inkSoft: '#BBAE9F',
    inkFaint: '#7F7366',
    line: '#3A3027',
    primary: '#27B5A7',
    primaryDark: '#5ED3C5',
    primarySoft: '#183A36',
    caloriesSoft: '#3F2A1B',
    fat: '#9D8DF5',
    water: '#4AA5FF',
    waterDeep: '#4F9DF0',
    waterSoft: '#1A2B3D',
    waterBarSoft: '#2C4A6B',
    danger: '#FF6369',
    bubble: '#2D251D',
    streakSoft: '#4A3020',
    heroWarm: ['#3A2A1E', '#4A3322'],
    heroWater: ['#1B2C40', '#203A57'],
    heroSleepy: ['#262238', '#2F2A48'],
    statusBar: 'light',
  },
};

/** Shop order: each theme unlocks only after the one before it is owned. */
export const THEMES: { id: ThemeId; name: string; price: number; preview: Palette }[] = [
  { id: 'classic', name: 'Classic', price: 0, preview: PALETTES.classic },
  { id: 'ocean', name: 'Ocean', price: 1000, preview: PALETTES.ocean },
  { id: 'matcha', name: 'Matcha', price: 1800, preview: PALETTES.matcha },
  { id: 'night', name: 'Night', price: 3600, preview: PALETTES.night },
];

/**
 * The active palette. It is swapped in place by `applyTheme`, and the root layout remounts the
 * app when the theme changes, so everything that reads `colors` during render picks it up.
 */
export const colors: Palette = { ...classic };

let version = 0;
let active: ThemeId = 'classic';

export function applyTheme(id: ThemeId) {
  if (id === active) return;
  Object.assign(colors, PALETTES[id] ?? classic);
  active = id;
  version++;
}

/**
 * Wraps a module-level style sheet so it is rebuilt from the current palette after a theme change:
 * `const styles = themed(() => StyleSheet.create({ ... }))`, used exactly like a normal sheet.
 */
export function themed<T extends object>(make: () => T): T {
  let cache = make();
  let builtFor = version;
  return new Proxy({} as T, {
    get(_, prop) {
      if (builtFor !== version) {
        cache = make();
        builtFor = version;
      }
      return cache[prop as keyof T];
    },
  });
}

export const fonts = {
  regular: 'Nunito_500Medium',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const radius = { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 };

export const shadow = {
  shadowColor: '#7A5A35',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
