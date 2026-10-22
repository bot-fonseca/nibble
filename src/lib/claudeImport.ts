/**
 * "Ask Claude" meal logging: the user copies this prompt into the Claude app with a photo or a
 * description, then pastes Claude's reply back and we read the NIBBLE block at the end of it.
 */
export const CLAUDE_PROMPT = `I'm logging a meal in my food tracker. Using the photo or description I give you, estimate the calories and macros for the whole meal. Be realistic about portion sizes, and if something is unclear, make your best guess and say briefly what you assumed.

End your reply with exactly this block (numbers only, no ranges):

NIBBLE
name: <short meal name>
kcal: <number>
protein: <grams>
carbs: <grams>
fat: <grams>`;

export interface ClaudeMeal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Reads the NIBBLE block from Claude's reply. Returns null when the calories can't be found. */
export function parseClaudeMeal(text: string): ClaudeMeal | null {
  // only look after the NIBBLE marker when there is one, so numbers in Claude's explanation are ignored
  const marker = text.search(/\bNIBBLE\b/i);
  const block = (marker >= 0 ? text.slice(marker) : text).replace(/[*_`]/g, '');

  const num = (...keys: string[]) => {
    for (const key of keys) {
      const m = block.match(new RegExp(`^\\s*[-•]?\\s*${key}\\s*[:=]\\s*~?\\s*(\\d+(?:[.,]\\d+)?)`, 'im'));
      if (m) return Math.max(0, Math.round(Number(m[1].replace(',', '.'))));
    }
    return null;
  };

  const kcal = num('kcal', 'calories', 'energy');
  if (kcal === null) return null;
  const name = block.match(/^\s*[-•]?\s*name\s*[:=]\s*(.+)$/im)?.[1].trim();
  return {
    name: (name || 'Meal').slice(0, 40),
    kcal,
    protein: num('protein') ?? 0,
    carbs: num('carbs', 'carbohydrates') ?? 0,
    fat: num('fat', 'fats') ?? 0,
  };
}
