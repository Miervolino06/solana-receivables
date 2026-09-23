export type Surface = 'landing' | 'connect' | 'workspace' | 'public';

// This is an entry flow, not authentication or an authorization boundary.
// Anyone can inspect a shared request or receipt without connecting a wallet.
export function resolveSurface(pathname: string, search: string, connected: boolean): Surface {
  if (new URLSearchParams(search).has('r') || pathname === '/verify' || pathname === '/verify/') return 'public';
  if (pathname === '/app' || pathname === '/app/') return connected ? 'workspace' : 'connect';
  return 'landing';
}
