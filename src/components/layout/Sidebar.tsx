"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/inventory", label: "재고 관리", icon: "📦" },
  { href: "/customers", label: "고객 관리", icon: "👥" },
  { href: "/reservations", label: "예약 관리", icon: "📅" },
  { href: "/calendar", label: "캘린더", icon: "📆" },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4">
        <span className="text-xl">🔧</span>
        <h1 className="text-lg font-bold">Auto Shop</h1>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-xl">
            ✕
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
