"use client";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="glass flex h-14 items-center px-4">
      <button
        onClick={onMenuClick}
        className="mr-3 rounded-lg p-1.5 hover:bg-white/10 transition-colors md:hidden"
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
