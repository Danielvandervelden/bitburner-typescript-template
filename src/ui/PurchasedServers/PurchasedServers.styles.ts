import type { CSSProperties } from 'react';

import type { Theme } from './PurchasedServers.utils.js';

export type PurchasedServersStyles = {
  actions: CSSProperties;
  button: CSSProperties;
  small: CSSProperties;
  content: CSSProperties;
  serverCard: CSSProperties;
  serverHeader: CSSProperties;
  host: CSSProperties;
  ram: CSSProperties;
  procTable: CSSProperties;
  th: CSSProperties;
  td: CSSProperties;
  empty: CSSProperties;
};

export function createPurchasedServersStyles(theme: Theme): PurchasedServersStyles {

  const actions: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  };

  const button: CSSProperties = {
    background: theme.button,
    color: theme.secondary,
    border: `1px solid ${theme.primary}`,
    padding: '5px 8px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '12px',
    userSelect: 'none',
  };

  const small: CSSProperties = {
    color: theme.secondary,
    fontSize: '12px',
    opacity: 0.9,
    userSelect: 'none',
  };

  const content: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '10px',
  };

  const serverCard: CSSProperties = {
    border: `1px solid rgba(255,255,255,0.08)`,
    background: 'rgba(0,0,0,0.15)',
    padding: '10px 10px 8px',
    marginBottom: '10px',
  };

  const serverHeader: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '6px',
  };

  const host: CSSProperties = {
    color: theme.primary,
    fontSize: '13px',
  };

  const ram: CSSProperties = {
    color: theme.secondary,
    fontSize: '12px',
    opacity: 0.9,
    whiteSpace: 'nowrap',
  };

  const procTable: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    color: theme.secondary,
  };

  const th: CSSProperties = {
    textAlign: 'left',
    fontWeight: 700,
    padding: '6px 6px',
    borderBottom: `1px solid rgba(255,255,255,0.12)`,
    color: theme.secondary,
    opacity: 0.9,
  };

  const td: CSSProperties = {
    padding: '6px 6px',
    borderBottom: `1px solid rgba(255,255,255,0.08)`,
    verticalAlign: 'top',
  };

  const empty: CSSProperties = {
    color: theme.warn,
    fontSize: '12px',
    padding: '6px 0 0',
    opacity: 0.9,
  };

  return { actions, button, small, content, serverCard, serverHeader, host, ram, procTable, th, td, empty };
}

