const LOCAL_SITE_URL = 'http://localhost:3002';
const PRODUCTION_SITE_URL = 'https://grub-lime.vercel.app';

function configuredOrigin(value: string | undefined, production: boolean): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const isHttp = url.protocol === 'http:';
    const isHttps = url.protocol === 'https:';

    if (
      (!isHttp && !isHttps) ||
      (production && !isHttps) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Canonical origin for absolute application URLs.
 *
 * NEXT_PUBLIC_SITE_URL is deployment configuration, rather than request data,
 * so forwarded Host headers cannot change magic-link destinations. Production
 * falls back to the current public deployment; local development stays on the
 * port used by this repository.
 */
export function getSiteUrl(
  configuredUrl = process.env.NEXT_PUBLIC_SITE_URL,
  environment = process.env.NODE_ENV
): string {
  const production = environment === 'production';
  const configured = configuredOrigin(configuredUrl?.trim(), production);

  if (configured) return configured;
  return production ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}
