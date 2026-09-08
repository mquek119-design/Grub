/**
 * Utility functions for automatic capitalization and consistent formatting of
 * recipes, cooking instructions/methods, and ingredients.
 */

const MINOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'per',
  'the',
  'to',
  'via',
  'with',
]);

/**
 * Capitalizes a single word taking into account hyphens (e.g. "stir-fry" -> "Stir-Fry").
 */
function capitalizeWord(word: string): string {
  if (!word) return word;
  return word
    .split('-')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join('-');
}

/**
 * Converts a recipe title to title case:
 * "creamy tomato and basil pasta" -> "Creamy Tomato and Basil Pasta"
 * "chicken stir-fry" -> "Chicken Stir-Fry"
 */
export function formatRecipeTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const words = trimmed.split(' ');
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      // First and last words are always capitalized
      if (index === 0 || index === words.length - 1) {
        return capitalizeWord(lower);
      }
      // Minor words remain lowercase unless capitalized
      if (MINOR_WORDS.has(lower)) {
        return lower;
      }
      return capitalizeWord(lower);
    })
    .join(' ');
}

/**
 * Formats a single instruction or cooking step:
 * - Strips leading numbering artifacts like "1. ", "Step 1: ", "1) ", "- ", "• "
 * - Capitalizes the first letter of each sentence
 * - Ensures valid end punctuation (. ! ?)
 * - Normalizes spacing
 *
 * Example: "1. boil the pasta until al dente" -> "Boil the pasta until al dente."
 * Example: "fry onions. then add garlic" -> "Fry onions. Then add garlic."
 */
export function formatInstruction(step: string): string {
  let cleaned = step.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Remove leading step numbering or bullet points
  // Matches: "1. ", "1) ", "Step 1: ", "Step 1 - ", "- ", "* ", "• "
  cleaned = cleaned.replace(/^(?:step\s*\d+[\s:.-]*|\d+[\s.)-]+\s*|[-*•]\s*)/i, '').trim();
  if (!cleaned) return '';

  // Capitalize after sentence-ending punctuation (. ! ?) followed by whitespace
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });

  // Ensure first character is uppercase
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Add terminating period if no ending punctuation exists
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Formats an array of instructions (cooking method).
 */
export function formatInstructionsList(instructions: string[]): string[] {
  return instructions
    .map((step) => formatInstruction(step))
    .filter((step) => step.length > 0);
}

/**
 * Capitalizes ingredient names cleanly:
 * "penne pasta" -> "Penne Pasta"
 * "tinned chopped tomatoes" -> "Tinned Chopped Tomatoes"
 */
export function formatIngredientName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  return trimmed
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (MINOR_WORDS.has(lower)) {
        return lower;
      }
      return capitalizeWord(lower);
    })
    .join(' ');
}

/**
 * Formats a full ingredient line:
 * "500 g penne pasta" -> "500 g Penne Pasta"
 * "2 tins chopped tomatoes" -> "2 tins Chopped Tomatoes"
 */
export function formatIngredientLine(line: string): string {
  const trimmed = line.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  // Match optional number, optional unit, and ingredient name
  const match = trimmed.match(/^(\d+(?:[.,]\d+)?\s*(?:[a-zA-Z]+\s+)?)(.*)$/);
  if (match) {
    const prefix = match[1];
    const name = match[2];
    if (name) {
      return `${prefix}${formatIngredientName(name)}`;
    }
  }

  return formatIngredientName(trimmed);
}
