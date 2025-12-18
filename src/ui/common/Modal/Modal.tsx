import type { ReactNode } from 'react';

import React from '../../../lib/react.js';

import { MODAL_DEFAULTS } from './Modal.constants.js';
import { createModalStyles } from './Modal.styles.js';
import { clamp, modalStorageKeys, readLocalStorageBool, readLocalStorageNumber, writeLocalStorage } from './Modal.utils.js';

export type ModalTheme = {
  primary: string;
  secondary: string;
  bg1: string;
  bg2: string;
  button: string;
  text: string;
};

export type ModalSize = {
  widthPx: number;
  heightPx: number;
  collapsedWidthPx: number;
};

export type ModalPlacement = {
  rightPx: number;
  bottomPx: number;
  marginPx: number;
};

export type ModalProps = {
  title: string;
  theme: ModalTheme;
  storageKey: string; // prefix; we'll store `${storageKey}:posX` etc
  onClose: () => void;
  headerRight?: ReactNode;
  children: ReactNode;
  size?: Partial<ModalSize>;
  placement?: Partial<ModalPlacement>;
};

export function Modal(props: ModalProps) {
  const { title, theme, storageKey, onClose, headerRight, children } = props;
  const size: ModalSize = {
    widthPx: props.size?.widthPx ?? MODAL_DEFAULTS.size.widthPx,
    heightPx: props.size?.heightPx ?? MODAL_DEFAULTS.size.heightPx,
    collapsedWidthPx: props.size?.collapsedWidthPx ?? MODAL_DEFAULTS.size.collapsedWidthPx,
  };
  const placement: ModalPlacement = {
    rightPx: props.placement?.rightPx ?? MODAL_DEFAULTS.placement.rightPx,
    bottomPx: props.placement?.bottomPx ?? MODAL_DEFAULTS.placement.bottomPx,
    marginPx: props.placement?.marginPx ?? MODAL_DEFAULTS.placement.marginPx,
  };

  const keys = React.useMemo(() => modalStorageKeys(storageKey), [storageKey]);

  const [collapsed, setCollapsed] = React.useState(() => readLocalStorageBool(keys.collapsed, false));

  const [pos, setPos] = React.useState(() => {
    const x = readLocalStorageNumber(keys.posX, Number.NaN);
    const y = readLocalStorageNumber(keys.posY, Number.NaN);
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };

    const w = Math.min(size.widthPx, Math.floor(window.innerWidth * 0.96));
    const h = Math.min(size.heightPx, Math.floor(window.innerHeight * 0.88));
    return {
      x: Math.max(placement.marginPx, window.innerWidth - w - placement.rightPx),
      y: Math.max(placement.marginPx, window.innerHeight - h - placement.bottomPx),
    };
  });

  const [dragging, setDragging] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  React.useEffect(() => {
    writeLocalStorage(keys.collapsed, collapsed ? '1' : '0');
  }, [collapsed, keys.collapsed]);

  const persistPos = React.useCallback(
    (p: { x: number; y: number }) => {
      writeLocalStorage(keys.posX, String(Math.round(p.x)));
      writeLocalStorage(keys.posY, String(Math.round(p.y)));
    },
    [keys.posX, keys.posY],
  );

  const clampToViewport = React.useCallback(
    (p: { x: number; y: number }) => {
      const rect = panelRef.current?.getBoundingClientRect();
      const w = rect?.width ?? size.widthPx;
      const h = rect?.height ?? size.heightPx;
      const minX = placement.marginPx;
      const minY = placement.marginPx;
      const maxX = Math.max(minX, window.innerWidth - w - placement.marginPx);
      const maxY = Math.max(minY, window.innerHeight - h - placement.marginPx);
      return { x: clamp(p.x, minX, maxX), y: clamp(p.y, minY, maxY) };
    },
    [panelRef, placement.marginPx, size.heightPx, size.widthPx],
  );

  React.useEffect(() => {
    const next = clampToViewport(pos);
    if (next.x !== pos.x || next.y !== pos.y) setPos(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  React.useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'm') setCollapsed((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [onClose]);

  const onTitleBarPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button,select,option,input,textarea,a,label')) return;

      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: pos.x,
        startY: pos.y,
      };
      setDragging(true);
      e.preventDefault();
      e.stopPropagation();
    },
    [pos.x, pos.y],
  );

  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startClientX;
      const dy = e.clientY - d.startClientY;
      setPos(clampToViewport({ x: d.startX + dx, y: d.startY + dy }));
      e.preventDefault?.();
    };

    const stop = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      setPos((p) => {
        const next = clampToViewport(p);
        persistPos(next);
        return next;
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', stop, { passive: true });
    window.addEventListener('pointercancel', stop, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerup', stop as any);
      window.removeEventListener('pointercancel', stop as any);
    };
  }, [clampToViewport, persistPos]);

  const styles = React.useMemo(
    () =>
      createModalStyles({
        theme,
        pos,
        collapsed,
        dragging,
        size,
        placement,
        zIndex: MODAL_DEFAULTS.zIndex,
      }),
    [theme, pos, collapsed, dragging, size, placement],
  );

  return (
    <div style={styles.root}>
      <div style={styles.panel} ref={panelRef}>
        <div style={styles.titleBar} onPointerDown={onTitleBarPointerDown}>
          <div style={styles.title} onDoubleClick={() => setCollapsed((v) => !v)} title="Double-click to minimize">
            {title}
          </div>
          <div style={styles.headerRight}>
            <button style={styles.chromeButton} onClick={() => setCollapsed((v) => !v)} title="Minimize (M)">
              {collapsed ? '+' : '-'}
            </button>
            <button style={styles.chromeButton} onClick={onClose} title="Close (Esc)">
              x
            </button>
          </div>
        </div>
        {headerRight && <div style={styles.controlBar}>{headerRight}</div>}
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

