"use client";

/**
 * LIGHT / DARK toggle (header, every page, phones included; beside the sketch pencil, same 44px
 * round button). A moon in light mode (go dark), a sun in dark mode (go light). aria-pressed tells
 * whether dark mode is on. It also keeps the theme following the OS until the visitor chooses
 * (src/lib/stores/theme.ts).
 */
import { useEffect } from "react";
import { followSystem, toggleTheme, useTheme } from "@/lib/stores/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  useEffect(() => followSystem(), []);
  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      data-qa="theme-toggle"
      onClick={toggleTheme}
      className={`sk-toggle theme-toggle${className ? ` ${className}` : ""}`}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        className="size-[22px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5" />
          </>
        ) : (
          <path d="M19.6 14.6A7.9 7.9 0 0 1 9.4 4.4a7.9 7.9 0 1 0 10.2 10.2z" />
        )}
      </svg>
    </button>
  );
}
