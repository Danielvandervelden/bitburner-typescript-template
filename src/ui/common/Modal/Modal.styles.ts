import type { CSSProperties } from 'react';

import type { ModalPlacement, ModalSize, ModalTheme } from './Modal.js';

export type ModalStyles = {
  root: CSSProperties;
  panel: CSSProperties;
  titleBar: CSSProperties;
  title: CSSProperties;
  headerRight: CSSProperties;
  chromeButton: CSSProperties;
  controlBar: CSSProperties;
  body: CSSProperties;
};

export function createModalStyles(opts: {
  theme: ModalTheme;
  pos: { x: number; y: number };
  collapsed: boolean;
  dragging: boolean;
  size: ModalSize;
  placement: ModalPlacement;
  zIndex: number;
}): ModalStyles {
  const { theme, pos, collapsed, dragging, size, zIndex } = opts;

  const root: CSSProperties = {
    position: 'fixed',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    zIndex,
    fontFamily: 'monospace',
    pointerEvents: 'none',
  };

  const panel: CSSProperties = {
    width: collapsed ? `${size.collapsedWidthPx}px` : `min(${size.widthPx}px, 96vw)`,
    height: collapsed ? 'auto' : `min(${size.heightPx}px, 88vh)`,
    background: theme.bg2,
    border: `1px solid ${theme.primary}`,
    boxShadow: `0 12px 60px rgba(0,0,0,0.6)`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  const titleBar: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '8px 10px',
    background: theme.bg1,
    borderBottom: collapsed ? 'none' : `1px solid ${theme.primary}`,
    cursor: dragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  const title: CSSProperties = {
    color: theme.text,
    fontSize: '13px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  };

  const headerRight: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  };

  const controlBar: CSSProperties = {
    display: collapsed ? 'none' : 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: theme.bg1,
    borderBottom: `1px solid rgba(255,255,255,0.12)`,
    flexWrap: 'wrap',
  };

  const chromeButton: CSSProperties = {
    background: theme.button,
    color: theme.secondary,
    border: `1px solid ${theme.primary}`,
    padding: '2px 8px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '18px',
    userSelect: 'none',
  };

  const body: CSSProperties = {
    display: collapsed ? 'none' : 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  };

  return { root, panel, titleBar, title, headerRight, chromeButton, controlBar, body };
}

