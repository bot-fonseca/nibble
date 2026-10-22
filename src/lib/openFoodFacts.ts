/** Packaged-food lookup by barcode, using the free Open Food Facts database (no key needed). */

export interface Product {
  code: string;
  name: string;
  brand: string | null;
  image: string | null;
  /** Nutrition per 100 g (or 100 ml). */
  per100: { kcal: number; protein: number; carbs: number; fat: number };
  /** Grams in one serving, when the product lists it. */
  servingG: number | null;
  servingLabel: string | null;
}

const FIELDS = 'product_name,brands,image_front_small_url,nutriments,serving_size,serving_quantity';

/**
 * Returns the product, or null when the barcode isn't in the database or has no calorie data.
 * Throws on network errors so the caller can tell "not found" from "offline".
 */
export async function fetchProduct(code: string): Promise<Product | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, {
    // Open Food Facts asks apps to identify themselves
    headers: { 'User-Agent': 'Nibble/1.0 (personal app)' },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Open Food Facts returned ${res.status}`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};
  const val = (key: string) => {
    const v = Number(n[key]);
    return Number.isFinite(v) && v >= 0 ? v : null;
  };
  // some products only list energy in kJ
  const kcal = val('energy-kcal_100g') ?? (val('energy-kj_100g') ?? val('energy_100g') ?? NaN) / 4.184;
  if (!Number.isFinite(kcal)) return null;

  const serving = Number(p.serving_quantity);
  return {
    code,
    name: String(p.product_name || 'Unnamed product').trim(),
    brand: p.brands ? String(p.brands).split(',')[0].trim() : null,
    image: p.image_front_small_url ?? null,
    per100: {
      kcal,
      protein: val('proteins_100g') ?? 0,
      carbs: val('carbohydrates_100g') ?? 0,
      fat: val('fat_100g') ?? 0,
    },
    servingG: Number.isFinite(serving) && serving > 0 ? serving : null,
    servingLabel: p.serving_size ? String(p.serving_size) : null,
  };
}

/** Nutrition for `grams` of the product, rounded for logging. */
export function forGrams(p: Product, grams: number) {
  const f = grams / 100;
  return {
    kcal: Math.round(p.per100.kcal * f),
    protein: Math.round(p.per100.protein * f),
    carbs: Math.round(p.per100.carbs * f),
    fat: Math.round(p.per100.fat * f),
  };
}
