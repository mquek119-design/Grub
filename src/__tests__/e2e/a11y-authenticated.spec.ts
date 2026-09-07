import { existsSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const authStatePath =
  process.env.PLAYWRIGHT_AUTH_STATE ?? '.playwright/auth/user.json';
const hasAuthState = existsSync(authStatePath);

const routes = [
  { name: 'Plan', path: '/plan' },
  { name: 'Recipes', path: '/recipes' },
  { name: 'Basket', path: '/basket' },
  { name: 'Split', path: '/split' },
] as const;

test.describe('authenticated route accessibility', () => {
  test.skip(
    !hasAuthState,
    `Save a signed-in browser state at ${authStatePath} before running this suite.`
  );
  test.use({ storageState: authStatePath });

  for (const route of routes) {
    test(`${route.name} has no WCAG A or AA axe violations`, async ({ page }) => {
      await page.goto(route.path);
      expect(new URL(page.url()).pathname).toBe(route.path);
      await page.locator('main').first().waitFor();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const violations = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target),
      }));

      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }

  test('keyboard users can skip the shared navigation', async ({ page }) => {
    await page.goto('/basket');
    expect(new URL(page.url()).pathname).toBe('/basket');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
