"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/inventory", label: "재고", icon: "📦" },
  { href: "/customers", label: "고객", icon: "👥" },
  { href: "/reservations", label: "예약", icon: "📅" },
  { href: "/estimates", label: "견적", icon: "📝" },
  { href: "/calendar", label: "캘린더", icon: "📆" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex glass md:hidden">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-all duration-200 ${
              isActive
                ? "text-[#d4b872]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
