import { NS } from '@ns';
import React, { ReactDOM } from '../../lib/react.js';

import {
  DEFAULT_ONLY_RUNNING,
  DEFAULT_POLL_INTERVAL_MS,
  POLL_INTERVAL_OPTIONS_MS,
  PURCHASED_SERVERS_ROOT_ID,
  STORAGE_KEYS,
} from './PurchasedServers.constants.js';
import { createPurchasedServersStyles } from './PurchasedServers.styles.js';
import {
  ServerRow,
  collectPurchasedServers,
  formatArgs,
  formatRam,
  readLocalStorageBool,
  readLocalStorageNumber,
  safeTheme,
  writeLocalStorage,
} from './PurchasedServers.utils.js';
import { Modal } from '../common/Modal/Modal.js';

function PurchasedServersModal(props: { ns: NS; onClose: () => void }) {
  const { ns, onClose } = props;
  const theme = React.useMemo(() => safeTheme(ns), [ns]);

  const [rows, setRows] = React.useState<ServerRow[]>(() => collectPurchasedServers(ns));
  const [onlyRunning, setOnlyRunning] = React.useState(() =>
    readLocalStorageBool(STORAGE_KEYS.onlyRunning, DEFAULT_ONLY_RUNNING),
  );
  const [intervalMs, setIntervalMs] = React.useState(() =>
    readLocalStorageNumber(STORAGE_KEYS.intervalMs, DEFAULT_POLL_INTERVAL_MS),
  );

  const styles = React.useMemo(() => createPurchasedServersStyles(theme), [theme]);

  React.useEffect(() => {
    const tick = () => setRows(collectPurchasedServers(ns));
    tick();
    const id = window.setInterval(tick, Math.max(250, intervalMs | 0));
    return () => window.clearInterval(id);
  }, [ns, intervalMs]);

  React.useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.onlyRunning, onlyRunning ? '1' : '0');
  }, [onlyRunning]);

  React.useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.intervalMs, String(intervalMs));
  }, [intervalMs]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') setRows(collectPurchasedServers(ns));
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [ns, onClose]);

  const filtered = React.useMemo(() => {
    if (!onlyRunning) return rows;
    return rows.filter((r) => r.procs.length > 0);
  }, [rows, onlyRunning]);

  const totalServers = rows.length;
  const shownServers = filtered.length;
  const totalProcs = filtered.reduce((acc, r) => acc + r.procs.length, 0);

  return (
    <Modal
      title="Purchased servers • running scripts"
      theme={theme}
      storageKey="bb:purchasedServers"
      onClose={onClose}
      headerRight={
        <div style={styles.actions}>
          <span style={styles.small}>
            {shownServers}/{totalServers} servers • {totalProcs}
          </span>
          <button style={styles.button} onClick={() => setOnlyRunning((v) => !v)} title="Toggle showing idle servers">
            {onlyRunning ? 'Only running' : 'Show idle'}
          </button>
          <label style={{ ...styles.small, display: 'flex', alignItems: 'center', gap: '6px' }}>
            poll
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              style={{
                background: theme.bg1,
                color: theme.secondary,
                border: `1px solid rgba(255,255,255,0.18)`,
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '4px 6px',
              }}
            >
              {POLL_INTERVAL_OPTIONS_MS.map((ms) => (
                <option key={ms} value={ms}>
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                </option>
              ))}
            </select>
          </label>
          <button style={styles.button} onClick={() => setRows(collectPurchasedServers(ns))} title="Refresh (R)">
            Refresh
          </button>
        </div>
      }
    >
      <div style={styles.content}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>No purchased servers are running scripts right now.</div>
        ) : (
          filtered.map((r) => {
            const usagePct = r.maxRam > 0 ? Math.min(100, Math.max(0, (r.usedRam / r.maxRam) * 100)) : 0;
            const upgradeText =
              r.nextRam && r.upgradeCost !== null
                ? `• upgrade → ${formatRam(r.nextRam)} ($${ns.formatNumber(r.upgradeCost, 2)})`
                : r.nextRam
                  ? `• upgrade → ${formatRam(r.nextRam)} (N/A)`
                  : '• MAX';
            return (
              <div key={r.host} style={styles.serverCard}>
                <div style={styles.serverHeader}>
                  <div style={styles.host}>{r.host}</div>
                  <div style={styles.ram}>
                    RAM {formatRam(r.usedRam)} / {formatRam(r.maxRam)} ({usagePct.toFixed(0)}%) {upgradeText}
                  </div>
                </div>

                {r.procs.length === 0 ? (
                  <div style={styles.empty}>idle</div>
                ) : (
                  <table style={styles.procTable}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: '52%' }}>script</th>
                        <th style={{ ...styles.th, width: '10%' }}>threads</th>
                        <th style={{ ...styles.th, width: '38%' }}>args</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.procs.map((p) => (
                        <tr key={p.pid}>
                          <td style={styles.td}>
                            <span style={{ color: theme.secondary }}>{p.filename}</span>
                          </td>
                          <td style={styles.td}>{p.threads}</td>
                          <td style={styles.td}>
                            <span style={{ opacity: 0.9 }}>{formatArgs(p.args as any)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

export async function main(ns: NS) {
  ns.disableLog('ALL');

  const doc = eval('document') as Document;
  const host = doc.createElement('div');
  host.id = PURCHASED_SERVERS_ROOT_ID;
  doc.body.appendChild(host);

  const cleanup = () => {
    try {
      ReactDOM.unmountComponentAtNode(host);
    } catch {
      // ignore
    }
    try {
      host.remove();
    } catch {
      // ignore
    }
  };

  ns.atExit(cleanup);

  await new Promise<void>((resolve) => {
    const onClose = () => {
      cleanup();
      resolve();
    };
    ReactDOM.render(<PurchasedServersModal ns={ns} onClose={onClose} />, host);
  });
}
