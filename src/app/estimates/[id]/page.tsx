"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchEstimate, updateEstimate, deleteEstimate } from "@/features/estimates/api";
import { useAppStore } from "@/store/useAppStore";
import type { Estimate } from "@/types/estimate";
import { ESTIMATE_STATUS_LABELS } from "@/types/estimate";

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimate(id)
      .then(setEstimate)
      .catch(() => addToast("견적서를 불러올 수 없습니다.", "error"))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await updateEstimate(id, { status: newStatus });
      setEstimate(updated);
      addToast(`상태가 '${ESTIMATE_STATUS_LABELS[newStatus]}'(으)로 변경되었습니다.`, "success");
    } catch {
      addToast("상태 변경 실패", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 견적서를 삭제하시겠습니까?")) return;
    try {
      await deleteEstimate(id);
      addToast("삭제되었습니다.", "success");
      router.push("/estimates");
    } catch {
      addToast("삭제 실패", "error");
    }
  };

  const formatCurrency = (n: number) => n.toLocaleString("ko-KR") + "원";

  const copyToClipboard = () => {
    if (!estimate) return;

    const lines: string[] = [];
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("   BIGS MOTORS 견적서");
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(`📋 견적번호: ${estimate.estimateNo}`);
    lines.push(`📅 작성일: ${new Date(estimate.createdAt).toLocaleDateString("ko-KR")}`);
    if (estimate.validUntil) {
      lines.push(`⏳ 유효기간: ${new Date(estimate.validUntil).toLocaleDateString("ko-KR")}`);
    }
    lines.push("");
    lines.push(`👤 고객: ${estimate.customer?.name || "-"}`);
    if (estimate.customer?.phone) lines.push(`📞 연락처: ${estimate.customer.phone}`);
    if (estimate.vehicle) {
      lines.push(`🚗 차량: ${estimate.vehicle.carModel}${estimate.vehicle.plateNumber ? ` (${estimate.vehicle.plateNumber})` : ""}`);
    }
    lines.push("");

    const laborItems = estimate.items?.filter((i) => i.type === "LABOR") || [];
    const partItems = estimate.items?.filter((i) => i.type === "PART") || [];

    if (laborItems.length > 0) {
      lines.push("【 공임 】");
      laborItems.forEach((item) => {
        lines.push(`  • ${item.name}  ${item.quantity}개 × ${item.unitPrice.toLocaleString()}원 = ${item.amount.toLocaleString()}원`);
      });
      lines.push("");
    }

    if (partItems.length > 0) {
      lines.push("【 부품 】");
      partItems.forEach((item) => {
        lines.push(`  • ${item.name}  ${item.quantity}개 × ${item.unitPrice.toLocaleString()}원 = ${item.amount.toLocaleString()}원`);
      });
      lines.push("");
    }

    lines.push("────────────────────");
    const subtotal = estimate.totalAmount + estimate.discount;
    lines.push(`  소계: ${subtotal.toLocaleString()}원`);
    if (estimate.discount > 0) {
      lines.push(`  할인: -${estimate.discount.toLocaleString()}원`);
    }
    lines.push(`  💰 합계: ${estimate.totalAmount.toLocaleString()}원`);
    lines.push("────────────────────");

    if (estimate.memo) {
      lines.push("");
      lines.push(`📝 비고: ${estimate.memo}`);
    }


    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      addToast("견적서가 클립보드에 복사되었습니다.", "success");
    }).catch(() => {
      addToast("복사에 실패했습니다.", "error");
    });
  };

  if (loading) return <p className="text-center py-10 text-[var(--muted-foreground)]">로딩 중...</p>;
  if (!estimate) return <p className="text-center py-10">견적서를 찾을 수 없습니다.</p>;

  const laborItems = estimate.items?.filter((i) => i.type === "LABOR") || [];
  const partItems = estimate.items?.filter((i) => i.type === "PART") || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{estimate.estimateNo}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {new Date(estimate.createdAt).toLocaleDateString("ko-KR")} 작성
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="glass-btn-outline rounded-lg px-4 py-2 text-sm font-medium"
          >
            복사
          </button>
          <Link
            href={`/estimates/${id}/print`}
            className="glass-btn rounded-lg px-4 py-2 text-sm font-medium"
          >
            인쇄 / PDF
          </Link>
          <button
            onClick={handleDelete}
            className="glass-btn-danger rounded-lg px-4 py-2 text-sm"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 상태 변경 */}
      <div className="flex gap-2 mb-6">
        {Object.entries(ESTIMATE_STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleStatusChange(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              estimate.status === key
                ? "glass-btn"
                : "border border-[var(--border)] hover:bg-[var(--accent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 고객/차량 정보 */}
      <div className="glass-card p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--muted-foreground)]">고객: </span>
            <span className="font-medium">{estimate.customer?.name}</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">연락처: </span>
            <span>{estimate.customer?.phone || "-"}</span>
          </div>
          {estimate.vehicle && (
            <>
              <div>
                <span className="text-[var(--muted-foreground)]">차량: </span>
                <span className="font-medium">{estimate.vehicle.carModel}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">번호판: </span>
                <span>{estimate.vehicle.plateNumber || "-"}</span>
              </div>
            </>
          )}
          {estimate.validUntil && (
            <div>
              <span className="text-[var(--muted-foreground)]">유효기간: </span>
              <span>{new Date(estimate.validUntil).toLocaleDateString("ko-KR")}</span>
            </div>
          )}
        </div>
      </div>

      {/* 공임 항목 */}
      {laborItems.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-blue-600">공임</h3>
          <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-3 py-2">항목</th>
                <th className="text-right px-3 py-2 w-20">수량</th>
                <th className="text-right px-3 py-2 w-28">단가</th>
                <th className="text-right px-3 py-2 w-28">금액</th>
              </tr>
            </thead>
            <tbody>
              {laborItems.map((item, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 부품 항목 */}
      {partItems.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-orange-600">부품</h3>
          <table className="w-full text-sm border border-[var(--border)] rounded-lg overflow-hidden">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-3 py-2">부품명</th>
                <th className="text-right px-3 py-2 w-20">수량</th>
                <th className="text-right px-3 py-2 w-28">단가</th>
                <th className="text-right px-3 py-2 w-28">금액</th>
              </tr>
            </thead>
            <tbody>
              {partItems.map((item, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 합계 */}
      <div className="glass-card p-4">
        <div className="flex justify-between text-sm mb-1">
          <span>소계</span>
          <span>{formatCurrency(estimate.totalAmount + estimate.discount)}</span>
        </div>
        {estimate.discount > 0 && (
          <div className="flex justify-between text-sm mb-1 text-[var(--destructive)]">
            <span>할인</span>
            <span>-{formatCurrency(estimate.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-[var(--border)] pt-2">
          <span>합계</span>
          <span>{formatCurrency(estimate.totalAmount)}</span>
        </div>
      </div>

      {estimate.memo && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--accent)]/50 text-sm">
          <span className="text-[var(--muted-foreground)]">비고: </span>{estimate.memo}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push("/estimates")}
          className="glass-card rounded-lg px-6 py-2 text-sm hover:bg-[var(--accent)]"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
