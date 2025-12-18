export const PURCHASED_SERVERS_ROOT_ID = 'bb-purchased-servers-panel-root';

export const STORAGE_KEYS = {
  collapsed: 'bb:purchasedServers:collapsed',
  onlyRunning: 'bb:purchasedServers:onlyRunning',
  intervalMs: 'bb:purchasedServers:intervalMs',
  posX: 'bb:purchasedServers:posX',
  posY: 'bb:purchasedServers:posY',
} as const;

export const DEFAULT_ONLY_RUNNING = true;
export const DEFAULT_POLL_INTERVAL_MS = 1000;

export const POLL_INTERVAL_OPTIONS_MS = [250, 500, 1000, 2000, 5000] as const;

export const PANEL_DEFAULTS = {
  rightPx: 24,
  bottomPx: 24,
  marginPx: 8,
  widthPx: 640,
  heightPx: 720,
  collapsedWidthPx: 520,
} as const;

