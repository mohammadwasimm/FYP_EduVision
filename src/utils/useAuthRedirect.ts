import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenCookieUtils } from './cookies';

/**
 * Returns a function that stores the auth token (if provided) and
 * navigates the user to /dashboard, with a hard-reload fallback.
 */
export function useAuthRedirect() {
  const nav = useNavigate();

  return useCallback((token?: string) => {
    if (token) tokenCookieUtils.setAccessToken(token);
    try {
      nav('/dashboard', { replace: true });
    } catch {
      window.location.replace(window.location.origin + '/dashboard');
    }
    setTimeout(() => {
      if (window.location.pathname !== '/dashboard') {
        window.location.replace(window.location.origin + '/dashboard');
      }
    }, 250);
  }, [nav]);
}
