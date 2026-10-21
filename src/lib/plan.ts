export type Goal = 'lose' | 'maintain' | 'gain' | 'healthy';
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'active' | 'very';
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'lowcarb';

export interface Profile {
  name: string;
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetKg: number;
  paceKg: number; // kg per week
  activity: Activity;
  diet: Diet;
  obstacles: string[];
}

export interface Plan {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  bmr: number;
  tdee: number;
  weeksToGoal: number | null;
  targetDate: number | null;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very: 1.725,
};

export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Lowest target weight we allow: keeps BMI at or above 18.5. */
export function minHealthyWeight(heightCm: number) {
  const m = heightCm / 100;
  return Math.ceil(18.5 * m * m);
}

export function suggestedWaterMl(weightKg: number, activity: Activity) {
  const base = weightKg * 33;
  const extra = activity === 'active' ? 350 : activity === 'very' ? 600 : 0;
  return Math.min(4500, Math.max(1500, Math.round((base + extra) / 250) * 250));
}

export function buildPlan(p: Profile, waterMl?: number): Plan {
  const bmr = Math.round(
    10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161),
  );
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[p.activity]);

  let calories = tdee;
  const changing = p.goal === 'lose' || p.goal === 'gain';
  if (changing) {
    const daily = (p.paceKg * 7700) / 7;
    if (p.goal === 'lose') {
      // never cut more than 25% of maintenance
      calories = tdee - Math.min(daily, tdee * 0.25);
    } else {
      calories = tdee + Math.min(daily, 500);
    }
  }
  const floor = p.sex === 'male' ? 1500 : 1200;
  calories = Math.max(floor, Math.round(calories / 10) * 10);

  const proteinPerKg = p.goal === 'maintain' || p.goal === 'healthy' ? 1.6 : 1.8;
  let proteinG = Math.round(Math.min(p.weightKg * proteinPerKg, (calories * 0.35) / 4));
  let fatG: number;
  let carbsG: number;
  if (p.diet === 'keto') {
    carbsG = 30;
    fatG = Math.round((calories - proteinG * 4 - carbsG * 4) / 9);
  } else if (p.diet === 'lowcarb') {
    carbsG = Math.round((calories * 0.25) / 4);
    fatG = Math.round((calories - proteinG * 4 - carbsG * 4) / 9);
  } else {
    fatG = Math.round((calories * 0.28) / 9);
    carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);
  }

  const diff = Math.abs(p.targetKg - p.weightKg);
  const weeksToGoal = changing && diff > 0 && p.paceKg > 0 ? Math.ceil(diff / p.paceKg) : null;
  const targetDate = weeksToGoal ? Date.now() + weeksToGoal * 7 * 86400000 : null;

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    waterMl: waterMl ?? suggestedWaterMl(p.weightKg, p.activity),
    bmr,
    tdee,
    weeksToGoal,
    targetDate,
  };
}
