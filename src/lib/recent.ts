/**
 * Recently viewed pieces, kept only in this browser (no account needed).
 * Stores product slugs, newest first; prices and photos are looked up fresh.
 */
const KEY = "ansh-arte-recent";
const MAX = 12;
export const RECENT_EVENT = "ansh-arte-recent";

export function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecent(slug: string) {
  try {
    const next = [slug, ...readRecent().filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Private mode or storage full: just don't remember
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {}
}
