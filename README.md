# Nibble

A calorie, macro and hydration tracker with a pet red panda that reacts to how you eat and drink. Inspired by BitePal, with its own mascot and design.

Built with **Expo SDK 58** (React Native + TypeScript), so the same code runs on Android and iOS. All data is stored locally on the phone.

## What's in it

**Onboarding (up to 20 steps)**
- Animated welcome: the red panda pops out of the water with a splash
- Name, goal, sex, age / height / weight rulers, target weight (kept at BMI ≥ 18.5), pace with estimated goal date
- Activity level, diet, obstacles + tailored tips, a "small habits add up" interstitial
- Hydration habit, daily water goal (auto-calculated, adjustable), glass size
- Hydration reminders: time window, interval, notification permission
- Adopt & name your pet (it pops out of the water again)
- "Building your plan" progress animation, then the plan summary with confetti

**Home**
- Greeting, streak counter, week strip (tap a past day to view it)
- Pet card: mood changes with your day (happy, hungry, thirsty, sleepy, excited) and it jumps when you tap it, log water or log a meal
- Calories-left ring, eaten/goal, protein / carbs / fat bars
- Hydration card with animated glass and quick +glass / +500 ml buttons
- Meals by breakfast / lunch / dinner / snacks, with delete

**Also**
- Log meal sheet: quick-add foods (search) or manual entry; photo/AI scan is a "coming soon" placeholder
- Water tab: big animated glass, quick adds, custom amount, 7-day chart, today's log, next reminder
- You tab: rename pet, adjust calorie/water goals and glass size, reminder settings, start over

**Hydration reminders** are scheduled locally for the next 7 days inside your window. They're re-planned whenever settings change or the app opens, and today's remaining ones are cancelled as soon as you hit your goal.

## Run it on your Android phone

1. Install **Expo Go** from the Play Store (it must support SDK 58).
2. On your computer:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go. Phone and computer need to be on the same Wi-Fi (or run `npx expo start --tunnel`).

Local notifications work in Expo Go on Android.

## Build an installable APK

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
EAS builds in the cloud and gives you a link to download the `.apk`.

## Push to a private GitHub repo

The project already has a git history. From this folder:

```bash
gh repo create nibble --private --source=. --push
```
(or create an empty private repo on github.com, then `git remote add origin <url> && git push -u origin main`)

## Project layout

```
src/
  app/                 routes (Expo Router)
    _layout.tsx        fonts, splash, onboarding guard, reminder sync
    onboarding.tsx     the whole onboarding flow
    (tabs)/            home (index), water, settings + custom tab bar
    log-meal.tsx       meal logging sheet
  components/          Pet, WaterPop, WaterGlass, Ring, Ruler, Confetti, RemindersEditor, ui
  lib/                 plan math, mood logic, notifications, dates, quick foods
  store.ts             zustand store persisted to AsyncStorage
  theme.ts             colours, fonts, radii
```

## Next steps

- AI photo recognition: send the photo to a vision model and fill the meal from its answer (`src/app/log-meal.tsx`, "Snap a photo" card)
- Progress screen (weight log + charts), pet outfits, fasting timer

Calorie targets use the Mifflin-St Jeor formula with a capped deficit and a minimum intake floor. They're general estimates, not medical advice.
