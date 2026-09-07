import { getSiteUrl } from '@/lib/siteUrl';

describe('getSiteUrl', () => {
  it('uses the local development origin outside production', () => {
    expect(getSiteUrl(undefined, 'development')).toBe('http://localhost:3002');
  });

  it('uses the known public deployment as the production fallback', () => {
    expect(getSiteUrl(undefined, 'production')).toBe('https://grub-lime.vercel.app');
  });

  it('normalises a configured HTTPS origin', () => {
    expect(getSiteUrl('https://grub.example/', 'production')).toBe('https://grub.example');
  });

  it('rejects unsafe or non-origin production values', () => {
    expect(getSiteUrl('http://grub.example', 'production')).toBe(
      'https://grub-lime.vercel.app'
    );
    expect(getSiteUrl('https://grub.example/welcome', 'production')).toBe(
      'https://grub-lime.vercel.app'
    );
  });
});
