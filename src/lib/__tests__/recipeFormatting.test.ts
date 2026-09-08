import {
  formatRecipeTitle,
  formatInstruction,
  formatInstructionsList,
  formatIngredientName,
  formatIngredientLine,
} from '../recipeFormatting';

describe('recipeFormatting', () => {
  describe('formatRecipeTitle', () => {
    it('capitalizes words in titles properly', () => {
      expect(formatRecipeTitle('creamy tomato and basil pasta')).toBe(
        'Creamy Tomato and Basil Pasta'
      );
      expect(formatRecipeTitle('chicken stir-fry with rice')).toBe('Chicken Stir-Fry with Rice');
      expect(formatRecipeTitle('quick & easy tacos')).toBe('Quick & Easy Tacos');
    });

    it('always capitalizes first and last words even if minor', () => {
      expect(formatRecipeTitle('in the mood for food')).toBe('In the Mood for Food');
    });

    it('handles empty or whitespace strings', () => {
      expect(formatRecipeTitle('')).toBe('');
      expect(formatRecipeTitle('   ')).toBe('');
    });
  });

  describe('formatInstruction', () => {
    it('removes leading step numbers and bullet points', () => {
      expect(formatInstruction('1. boil the pasta until al dente')).toBe(
        'Boil the pasta until al dente.'
      );
      expect(formatInstruction('Step 2: fry the garlic')).toBe('Fry the garlic.');
      expect(formatInstruction('3) chop the onions')).toBe('Chop the onions.');
      expect(formatInstruction('- stir in the sauce')).toBe('Stir in the sauce.');
      expect(formatInstruction('• simmer for 10 minutes')).toBe('Simmer for 10 minutes.');
    });

    it('capitalizes the first letter of each sentence and appends a period', () => {
      expect(formatInstruction('boil water. add salt')).toBe('Boil water. Add salt.');
      expect(formatInstruction('cook until tender! serve immediately')).toBe(
        'Cook until tender! Serve immediately.'
      );
    });

    it('preserves existing punctuation', () => {
      expect(formatInstruction('Is it done? Check with a fork.')).toBe(
        'Is it done? Check with a fork.'
      );
      expect(formatInstruction('Enjoy!')).toBe('Enjoy!');
    });
  });

  describe('formatInstructionsList', () => {
    it('cleans up and filters an array of steps', () => {
      const input = [
        '1. dice the onions',
        '  ',
        '2. heat oil in pan. add onions',
        'serve hot!',
      ];
      expect(formatInstructionsList(input)).toEqual([
        'Dice the onions.',
        'Heat oil in pan. Add onions.',
        'Serve hot!',
      ]);
    });
  });

  describe('formatIngredientName and formatIngredientLine', () => {
    it('formats ingredient names with title case', () => {
      expect(formatIngredientName('penne pasta')).toBe('Penne Pasta');
      expect(formatIngredientName('clove of garlic')).toBe('Clove of Garlic');
    });

    it('formats full ingredient lines while preserving quantities and units', () => {
      expect(formatIngredientLine('500 g penne pasta')).toBe('500 g Penne Pasta');
      expect(formatIngredientLine('2 tins chopped tomatoes')).toBe('2 tins Chopped Tomatoes');
      expect(formatIngredientLine('1 lime')).toBe('1 Lime');
    });
  });
});
