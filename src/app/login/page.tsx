"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("비밀번호가 틀렸습니다.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🔧</span>
          <h1 className="text-xl font-bold mt-3" style={{ color: "#d4b872" }}>
            BIGS MOTORS
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            오토샵 매니저
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="비밀번호 입력"
              autoFocus
              className="glass-input w-full rounded-lg px-4 py-3 text-sm text-center tracking-widest"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)] text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="glass-btn w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
