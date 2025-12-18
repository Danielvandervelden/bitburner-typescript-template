import { NS } from '@ns';

export type Proc = ReturnType<NS['ps']>[number];

export type ServerRow = {
  host: string;
  maxRam: number;
  usedRam: number;
  nextRam: number | null;
  upgradeCost: number | null;
  procs: Proc[];
};

export type Theme = {
  primary: string;
  secondary: string;
  bg1: string;
  bg2: string;
  button: string;
  text: string;
  warn: string;
  err: string;
};

export function formatRam(gb: number) {
  if (!Number.isFinite(gb)) return '0GB';
  if (gb < 1024) return `${gb.toFixed(gb >= 10 ? 0 : 1)}GB`;
  return `${(gb / 1024).toFixed(1)}TB`;
}

export function formatArgs(args: (string | number | boolean)[]) {
  if (!args.length) return '';
  // Bitburner prints args in a loose, readable way; keep it compact.
  return args
    .map((a) => (typeof a === 'string' ? (a.includes(' ') ? JSON.stringify(a) : a) : String(a)))
    .join(' ');
}

export function safeTheme(ns: NS): Theme {
  // ns.ui.getTheme() exists in modern BB; fall back to sane defaults if anything is missing.
  const t = (ns.ui as any)?.getTheme?.() ?? {};
  const primary = t.primary ?? '#00ff9f';
  const secondary = t.secondary ?? '#ffffff';
  const bg1 = t.backgroundprimary ?? '#0b0f14';
  const bg2 = t.backgroundsecondary ?? '#111927';
  const button = t.button ?? '#0f2136';
  const text = t.primary ?? t.text ?? '#00ff9f';
  const warn = t.warning ?? '#f6c177';
  const err = t.error ?? '#ff6b6b';
  return { primary, secondary, bg1, bg2, button, text, warn, err };
}

export function collectPurchasedServers(ns: NS): ServerRow[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const hosts = ns.getPurchasedServers().slice().sort((a, b) => collator.compare(a, b));
  const maxPurchasableRam = ns.getPurchasedServerMaxRam();
  return hosts.map((host) => ({
    host,
    maxRam: ns.getServerMaxRam(host),
    usedRam: ns.getServerUsedRam(host),
    nextRam: (() => {
      const current = ns.getServerMaxRam(host);
      if (!Number.isFinite(current) || current <= 0) return null;
      if (current >= maxPurchasableRam) return null;
      return Math.min(maxPurchasableRam, current * 2);
    })(),
    upgradeCost: (() => {
      const current = ns.getServerMaxRam(host);
      if (!Number.isFinite(current) || current <= 0) return null;
      if (current >= maxPurchasableRam) return null;
      const next = Math.min(maxPurchasableRam, current * 2);
      const cost = ns.getPurchasedServerUpgradeCost(host, next);
      return Number.isFinite(cost) && cost >= 0 ? cost : null;
    })(),
    procs: ns
      .ps(host)
      .slice()
      .sort((a, b) => collator.compare(a.filename, b.filename)),
  }));
}

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

