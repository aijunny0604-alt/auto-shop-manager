"use client";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 items-center border-b border-[var(--border)] bg-[var(--card)] px-4">
      <button
        onClick={onMenuClick}
        className="mr-3 rounded-lg p-1.5 hover:bg-[var(--accent)] md:hidden"
      >
        <span className="text-xl">☰</span>
      </button>
      <div className="flex-1" />
      <span className="text-sm text-[var(--muted-foreground)]">
        BIGS MOTORS 오토샵 매니저
      </span>
    </header>
  );
}
