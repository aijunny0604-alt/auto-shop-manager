"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import ToastContainer from "@/components/ui/Toast";
import { useAppStore } from "@/store/useAppStore";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/login");
        } else {
          setAuthenticated(true);
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setAuthChecked(true));
  }, [pathname, isLoginPage, router]);

  // 로그인 페이지면 레이아웃 없이 렌더링
  if (isLoginPage) return <>{children}</>;

  // 인증 확인 중
  if (!authChecked || !authenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-[var(--muted-foreground)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
