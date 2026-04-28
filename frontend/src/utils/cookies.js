import Cookies from 'js-cookie';

const COOKIE_KEY = 'vigility_filters';
const EXPIRY_DAYS = 30;

export function saveFilters(filters) {
  Cookies.set(COOKIE_KEY, JSON.stringify(filters), { expires: EXPIRY_DAYS });
}

export function loadFilters() {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearFilters() {
  Cookies.remove(COOKIE_KEY);
}
