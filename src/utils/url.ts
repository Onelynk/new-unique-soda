/**
 * Automatically determines the current deployed website URL for QR code and Share functionality.
 * Respects user instruction: "Keep QR/share using the current deployed Vercel URL, not localhost or preview URLs."
 */
export function getRuntimeMenuUrl(): string {
  // If explicitly configured via environment variable
  const envUrl = (
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SITE_URL ||
    ''
  ).trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // If Vercel URL is available from environment
  const vercelEnvUrl = (import.meta.env.VITE_VERCEL_URL || '').trim();
  if (vercelEnvUrl) {
    return `https://${vercelEnvUrl.replace(/\/+$/, '')}`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Check if running on localhost or inside a cloud/preview iframe sandbox
    const isLocalOrPreview =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.internal') ||
      hostname.includes('googleusercontent.com') ||
      hostname.includes('cloudworkstations.dev') ||
      hostname.includes('aistudio');

    if (!isLocalOrPreview) {
      // Running on actual production domain or deployed vercel.app
      let pathname = window.location.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      return `${window.location.origin}${pathname === '/' ? '' : pathname}`;
    }
  }

  // Production Vercel URL fallback for preview and local development
  return 'https://unique-soda.vercel.app';
}

