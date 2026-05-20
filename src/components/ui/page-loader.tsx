"use client";

/**
 * PageLoader — full-screen animated transition overlay.
 * Shown during login/logout to mask route changes.
 * CSS-only animated dot grid inspired by the wave-grid design.
 */

import { useEffect, useState } from "react";

export function PageLoader({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    } else {
      // Fade out then unmount
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950"
      style={{
        animation: show ? "loaderFadeIn 0.2s ease forwards" : "loaderFadeOut 0.4s ease forwards",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Dot grid wave */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 10px)",
            gridTemplateRows: "repeat(10, 10px)",
            gap: "3px",
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const delay = ((col + row) * 0.06).toFixed(2);
            return (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  animation: `loaderDot 1.4s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  opacity: 0.15,
                }}
              />
            );
          })}
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Leaex
        </p>
      </div>

      <style>{`
        @keyframes loaderDot {
          0%, 100% { opacity: 0.12; transform: scale(0.6); }
          50%       { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes loaderFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes loaderFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
