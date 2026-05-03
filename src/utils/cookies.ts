// Cookie utilities for token management
export const tokenCookieUtils = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },
  removeAccessToken: (): void => {
    localStorage.removeItem('access_token');
  },
  // Decodes the JWT payload client-side (no signature check) to verify expiry
  isTokenValid: (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.exp && Math.floor(Date.now() / 1000) > payload.exp) return false;
      return true;
    } catch {
      return false;
    }
  },
};
