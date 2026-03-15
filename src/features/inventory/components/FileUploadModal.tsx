"use client";

import { useState, useRef, useCallback } from "react";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}

export default function FileUploadModal({
  open,
  onClose,
  onFileSelected,
}: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      setError("CSV 또는 Excel 파일만 업로드 가능합니다. (.csv, .xlsx, .xls)");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("파일 크기는 10MB 이하여야 합니다.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-[var(--card)] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">파일 업로드</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          빅스모터스 구글시트에서 내보낸 CSV 또는 Excel 파일을 업로드하세요.
        </p>

        {/* 드래그 앤 드롭 영역 */}
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            {selectedFile ? (
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">
                  파일을 끌어다 놓거나 클릭하여 선택
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  CSV, XLSX, XLS (최대 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            미리보기
          </button>
        </div>
      </div>
    </div>
  );
}
