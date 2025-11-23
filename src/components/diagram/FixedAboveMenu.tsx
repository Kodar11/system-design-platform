"use client";

import React, { useEffect, useRef } from 'react';

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onExportJSON: () => void;
  onExportPNG: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FixedAboveMenu: React.FC<Props> = ({ anchorRef, onClose, onExportJSON, onExportPNG, onImport }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && !anchorRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, anchorRef]);

  // Compute position
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  useEffect(() => {
    const compute = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor || !menu) return;

      // First render invisible at 0,0 to measure size reliably
      setStyle({ position: 'fixed', left: 0, top: 0, visibility: 'hidden', zIndex: 9999 });

      // Measure on next frame after invisible render
      window.requestAnimationFrame(() => {
        const rect = anchor.getBoundingClientRect();
        const mRect = menu.getBoundingClientRect();

        // Compute top so menu bottom is 8px above anchor top
        const top = rect.top - mRect.height - 8;
        // Center horizontally on anchor, then nudge slightly right so menu aligns visually above the button
        const baseLeft = rect.left + rect.width / 2 - mRect.width / 2;
        const horizontalOffset = 20; // tweak this value if you want more/less shift
        const left = baseLeft + horizontalOffset;

        // Keep menu within viewport horizontal bounds with small padding
        const padding = 8;
        const clampedLeft = Math.min(
          Math.max(padding, left),
          window.innerWidth - mRect.width - padding
        );

        const clampedTop = Math.max(padding, top);

        setStyle({
          position: 'fixed',
          left: clampedLeft,
          top: clampedTop,
          visibility: 'visible',
          zIndex: 9999,
        });
      });
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [anchorRef]);

  return (
    <div ref={menuRef} style={style} className="inline-block bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg">
      <button
        onClick={() => { onExportJSON(); onClose(); }}
        className="text-left px-3 py-2 hover:bg-accent/40 text-foreground block"
        title="Export JSON"
      >
        Export JSON
      </button>
      <button
        onClick={() => { onExportPNG(); onClose(); }}
        className="text-left px-3 py-2 hover:bg-accent/40 text-foreground block"
        title="Export PNG"
      >
        Export PNG
      </button>
      <label className="text-left px-3 py-2 hover:bg-accent/40 cursor-pointer text-foreground block">
        Import JSON
        <input
          type="file"
          accept=".json"
          onChange={(e) => { onImport(e); onClose(); }}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default FixedAboveMenu;
