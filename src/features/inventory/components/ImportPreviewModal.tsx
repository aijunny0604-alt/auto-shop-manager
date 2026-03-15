"use client";

import { useState } from "react";

interface PreviewData {
  fileName: string;
  headers: string[];
  totalRows: number;
  validRows: number;
  previewRows: Record<string, string | number | null>[];
  inventoryItems: {
    name: string;
    category: string;
    totalUsed: number;
    occurrences: number;
  }[];
}

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewData: PreviewData | null;
  onConfirmImport: () => void;
  importing: boolean;
}

export default function ImportPreviewModal({
  open,
  onClose,
  previewData,
  onConfirmImport,
  importing,
}: ImportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"raw" | "inventory">("inventory");

  if (!open || !previewData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-xl bg-[var(--card)] p-6 shadow-xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">데이터 미리보기</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {previewData.fileName} - 전체 {previewData.totalRows}행 중{" "}
              {previewData.validRows}행 유효
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl"
          >
            &times;
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "inventory"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            재고 아이템 ({previewData.inventoryItems.length}건)
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "raw"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            원본 데이터 (상위 20행)
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-auto min-h-0">
          {activeTab === "inventory" && (
            <div>
              {previewData.inventoryItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <p className="text-lg mb-2">재고 아이템 데이터가 없습니다</p>
                  <p className="text-sm">
                    CSV 파일에 항목/사용량 컬럼이 있는지 확인하세요
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 px-3 text-left font-medium">부품명</th>
                      <th className="py-2 px-3 text-left font-medium">
                        카테고리 (자동감지)
                      </th>
                      <th className="py-2 px-3 text-right font-medium">
                        총 사용량
                      </th>
                      <th className="py-2 px-3 text-right font-medium">
                        사용 횟수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.inventoryItems.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50"
                      >
                        <td className="py-2 px-3 font-medium">{item.name}</td>
                        <td className="py-2 px-3">
                          <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">{item.totalUsed}</td>
                        <td className="py-2 px-3 text-right">
                          {item.occurrences}회
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div className="overflow-x-auto">
              {previewData.previewRows.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  데이터 행이 없습니다
                </div>
              ) : (
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 px-2 text-left font-medium text-[var(--muted-foreground)]">
                        #
                      </th>
                      {previewData.headers.map((h, i) => (
                        <th
                          key={i}
                          className="py-2 px-2 text-left font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.previewRows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50"
                      >
                        <td className="py-1.5 px-2 text-[var(--muted-foreground)]">
                          {i + 1}
                        </td>
                        {previewData.headers.map((h, j) => (
                          <td key={j} className="py-1.5 px-2 max-w-[150px] truncate">
                            {row[h] !== null && row[h] !== undefined
                              ? String(row[h])
                              : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {previewData.inventoryItems.length > 0 && (
              <>
                재고 {previewData.inventoryItems.length}개 아이템 + 예약/서비스
                데이터가 임포트됩니다
              </>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
            >
              취소
            </button>
            <button
              onClick={onConfirmImport}
              disabled={importing}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {importing ? "임포트 중..." : "임포트 실행"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
