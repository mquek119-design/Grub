import { activeTabHref } from '../tabs';

describe('activeTabHref', () => {
  it('maps primary tab routes correctly', () => {
    expect(activeTabHref('/')).toBe('/');
    expect(activeTabHref('/plan')).toBe('/plan');
    expect(activeTabHref('/basket')).toBe('/basket');
    expect(activeTabHref('/split')).toBe('/split');
    expect(activeTabHref('/kitchen')).toBe('/kitchen');
  });

  it('maps subroutes to their parent tab', () => {
    expect(activeTabHref('/recipes')).toBe('/kitchen');
    expect(activeTabHref('/recipes/123')).toBe('/kitchen');
    expect(activeTabHref('/leftovers')).toBe('/kitchen');
    expect(activeTabHref('/pantry')).toBe('/kitchen');
  });

  it('returns null for non-tab routes such as account, settings, and dev', () => {
    expect(activeTabHref('/account')).toBeNull();
    expect(activeTabHref('/settings')).toBeNull();
    expect(activeTabHref('/dev')).toBeNull();
    expect(activeTabHref('/privacy')).toBeNull();
    expect(activeTabHref('/terms')).toBeNull();
  });
});
