export const AUTH_KEY = "socforge_auth";

export function checkAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function setAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, "true");
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}
