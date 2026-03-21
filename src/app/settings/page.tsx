"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BackupPreview {
  exportedAt: string;
  version: string;
  data: Record<string, unknown[]>;
}

const TABLE_LABELS: Record<string, string> = {
  customers: "고객",
  vehicles: "차량",
  serviceRecords: "정비 기록",
  servicePartUsed: "사용 부품",
  inventoryItems: "재고 품목",
  stockLogs: "재고 로그",
  reservations: "예약",
  estimates: "견적서",
  estimateItems: "견적 항목",
  importHistories: "임포트 이력",
};

export default function SettingsPage() {
  const router = useRouter();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lastBackupAt");
    if (saved) setLastBackup(saved);

    // Google 연결 상태 확인
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((data) => setGoogleConnected(data.connected))
      .catch(() => setGoogleConnected(false))
      .finally(() => setGoogleLoading(false));
  }, []);

  const handleGoogleDisconnect = async () => {
    if (!confirm("Google 계정 연동을 해제하시겠습니까?\nGoogle Calendar 동기화가 중단됩니다.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("해제 실패");
      setGoogleConnected(false);
    } catch {
      alert("Google 계정 해제에 실패했습니다.");
    } finally {
      setDisconnecting(false);
    }
  };

  // ── 백업 다운로드 ──
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) throw new Error("백업 내보내기 실패");

      const blob = await res.blob();

      // Content-Disposition에서 파일명 추출
      const disposition = res.headers.get("Content-Disposition");
      let downloadName = "bigs-motors-backup.json";
      if (disposition) {
        const match = disposition.match(/filename="?(.+?)"?$/);
        if (match) downloadName = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem("lastBackupAt", now);
      setLastBackup(now);
    } catch (err) {
      alert(err instanceof Error ? err.message : "백업에 실패했습니다.");
    } finally {
      setBackupLoading(false);
    }
  };

  // ── 파일 선택 → 미리보기 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreResult(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setFileName("");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as BackupPreview;
        if (!parsed.version || !parsed.data) {
          throw new Error("유효하지 않은 백업 파일");
        }
        setPreview(parsed);
      } catch {
        setPreview(null);
        alert("유효하지 않은 백업 파일입니다. JSON 형식을 확인해주세요.");
      }
    };
    reader.readAsText(file);
  };

  // ── 복원 실행 ──
  const handleRestore = async () => {
    if (!preview) return;

    const confirmed = confirm(
      "정말 복원하시겠습니까?\n\n기존 데이터가 모두 삭제되고 백업 데이터로 대체됩니다.\n이 작업은 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setRestoreLoading(true);
    setRestoreResult(null);

    try {
      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "복원에 실패했습니다.");
      }

      setRestoreResult({
        type: "success",
        message: "데이터가 성공적으로 복원되었습니다.",
      });
      setPreview(null);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setRestoreResult({
        type: "error",
        message: err instanceof Error ? err.message : "복원에 실패했습니다.",
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="space-y-6">
        {/* ── Google 계정 연동 ── */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1">Google 계정 연동</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Google Calendar과 연동하여 예약 일정을 자동 동기화합니다.
          </p>

          {googleLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">확인 중...</p>
          ) : googleConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--success)]" />
                <span className="text-sm font-medium text-[var(--success)]">Google 계정 연결됨</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="/api/auth/google"
                  className="glass-btn rounded-lg px-4 py-2 text-sm font-medium"
                >
                  다른 계정으로 변경
                </a>
                <button
                  onClick={handleGoogleDisconnect}
                  disabled={disconnecting}
                  className="glass-btn-danger rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {disconnecting ? "해제 중..." : "연동 해제"}
                </button>
              </div>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              className="glass-btn rounded-lg px-5 py-2.5 text-sm font-medium inline-block"
            >
              Google 계정 연결
            </a>
          )}
        </section>

        {/* ── 데이터 백업 ── */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1">데이터 백업</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            모든 데이터를 JSON 파일로 내보냅니다.
          </p>

          {lastBackup && (
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              마지막 백업: {formatDate(lastBackup)}
            </p>
          )}

          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="glass-btn rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {backupLoading ? "백업 중..." : "데이터 백업"}
          </button>
        </section>

        {/* ── 데이터 복원 ── */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1">데이터 복원</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            백업 JSON 파일에서 데이터를 복원합니다.
          </p>

          {/* 경고 메시지 */}
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
            }}
          >
            <p className="font-semibold" style={{ color: "var(--destructive)" }}>
              주의
            </p>
            <p>
              복원을 실행하면 기존 데이터가 <strong>모두 삭제</strong>되고 백업
              파일의 데이터로 대체됩니다. 복원 전에 현재 데이터를 먼저
              백업해주세요.
            </p>
          </div>

          {/* 파일 업로드 */}
          <label className="block mb-4">
            <span className="text-sm text-[var(--muted-foreground)] mb-1 block">
              백업 파일 선택 (.json)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="glass-input w-full rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary)] file:px-3 file:py-1 file:text-sm file:font-medium file:text-[var(--primary-foreground)] file:cursor-pointer"
            />
          </label>

          {/* 미리보기 */}
          {preview && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">
                파일: {fileName}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                백업 일시: {formatDate(preview.exportedAt)} / 버전:{" "}
                {preview.version}
              </p>

              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <th className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">
                        테이블
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--muted-foreground)]">
                        레코드 수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(TABLE_LABELS).map(([key, label]) => (
                      <tr
                        key={key}
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <td className="px-3 py-2">{label}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {Array.isArray(preview.data[key])
                            ? preview.data[key].length.toLocaleString()
                            : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleRestore}
                disabled={restoreLoading}
                className="glass-btn-danger rounded-lg px-5 py-2.5 text-sm font-medium mt-4 disabled:opacity-50"
              >
                {restoreLoading ? "복원 중..." : "복원 시작"}
              </button>
            </div>
          )}

          {/* 복원 결과 */}
          {restoreResult && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={
                restoreResult.type === "success"
                  ? {
                      backgroundColor: "rgba(52, 211, 153, 0.1)",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                      color: "#6ee7b7",
                    }
                  : {
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fca5a5",
                    }
              }
            >
              {restoreResult.message}
            </div>
          )}
        </section>

        {/* ── 로그아웃 ── */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1">로그아웃</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            현재 세션을 종료하고 로그인 화면으로 돌아갑니다.
          </p>
          <button
            onClick={async () => {
              setLoggingOut(true);
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            disabled={loggingOut}
            className="glass-btn-outline rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </section>
      </div>
    </div>
  );
}
