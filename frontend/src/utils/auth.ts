/**
 * Helper utilities for session and token management.
 * Prioritizes sessionStorage for tab-isolated multi-account testing,
 * with fallback to localStorage.
 */

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('token', token);
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
};
