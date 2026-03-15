"use client";

interface ImportResult {
  success: boolean;
  importId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  inventoryItemsCreated: number;
}

interface ImportResultModalProps {
  open: boolean;
  onClose: () => void;
  result: ImportResult | null;
}

export default function ImportResultModal({
  open,
  onClose,
  result,
}: ImportResultModalProps) {
  if (!open || !result) return null;

  const isSuccess = result.errorCount === 0;
  const isPartial = result.errorCount > 0 && result.successCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-[var(--card)] p-6 shadow-xl">
        {/* 결과 아이콘 */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">
            {isSuccess ? "✅" : isPartial ? "⚠️" : "❌"}
          </div>
          <h2 className="text-lg font-bold">
            {isSuccess
              ? "임포트 완료"
              : isPartial
                ? "부분 임포트 완료"
                : "임포트 실패"}
          </h2>
        </div>

        {/* 결과 요약 */}
        <div className="rounded-lg bg-[var(--muted)] p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">전체 행 수</span>
            <span className="font-medium">{result.totalRows}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">성공</span>
            <span className="font-medium text-green-600">
              {result.successCount}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">
              재고 아이템 처리
            </span>
            <span className="font-medium">
              {result.inventoryItemsCreated}개
            </span>
          </div>
          {result.errorCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">오류</span>
              <span className="font-medium text-[var(--destructive)]">
                {result.errorCount}
              </span>
            </div>
          )}
        </div>

        {/* 에러 목록 */}
        {result.errors.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">오류 상세:</p>
            <div className="max-h-32 overflow-auto rounded-lg bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
              {result.errors.map((err, i) => (
                <p
                  key={i}
                  className="text-xs text-[var(--destructive)]"
                >
                  {err}
                </p>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          확인
        </button>
      </div>
    </div>
  );
}
