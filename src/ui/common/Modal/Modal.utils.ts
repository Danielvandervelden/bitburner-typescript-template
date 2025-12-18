export function readLocalStorageBool(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

export function readLocalStorageNumber(key: string, fallback: number) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return n;
  if (max < min) return min;
  return Math.min(max, Math.max(min, n));
}

export function modalStorageKeys(storageKey: string) {
  return {
    collapsed: `${storageKey}:collapsed`,
    posX: `${storageKey}:posX`,
    posY: `${storageKey}:posY`,
  } as const;
}

