/**
 * Automatically determines the current deployed website URL for QR code and Share functionality.
 * Default canonical URL: https://new-unique-soda.vercel.app
 */
export const OFFICIAL_PRODUCTION_URL = 'https://new-unique-soda.vercel.app';

export function getRuntimeMenuUrl(): string {
  // 1. If explicitly configured via environment variable
  const envUrl = (
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SITE_URL ||
    ''
  ).trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Check current browser hostname if loaded in production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Detect ephemeral Vercel preview or branch deployment domains
    // (e.g. *-projects.vercel.app or hash-based deployment links)
    const isVercelPreviewOrEphemeral =
      hostname.includes('-projects.vercel.app') ||
      (hostname.endsWith('.vercel.app') && hostname !== 'new-unique-soda.vercel.app');

    const isLocalOrDev =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.internal') ||
      hostname.includes('googleusercontent.com') ||
      hostname.includes('cloudworkstations.dev') ||
      hostname.includes('run.app') ||
      hostname.includes('aistudio');

    if (!isLocalOrDev && !isVercelPreviewOrEphemeral) {
      // User is on the official production domain or a custom root domain
      let pathname = window.location.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      return `${window.location.origin}${pathname === '/' ? '' : pathname}`;
    }
  }

  // 3. Always fallback to the official production URL
  return OFFICIAL_PRODUCTION_URL;
}

