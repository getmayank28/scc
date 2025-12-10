export const WS_SESSION_KEY = "ws_session";

export function saveToSessionStorage(key: string, value: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, value);
  }
}

export function getFromSessionStorage(key: string): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(key);
  }
  return null;
}

export function clearFromSessionStorage(key: string) {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(key);
  }
}
