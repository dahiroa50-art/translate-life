import { STORAGE_KEY } from "./constants";

export function saveToHistory(entry: any) {
  try {
    const existing = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    const updated = [entry, ...existing].slice(0, 20);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch {}
}

export function loadHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
}
