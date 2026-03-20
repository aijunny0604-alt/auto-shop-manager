"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchInventory, previewImport, importFile, exportInventory } from "@/features/inventory/api";
import type { InventoryItem, ImportPreviewResult, ImportResult } from "@/types/inventory";
import { CATEGORIES } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";
import SearchBar from "@/components/ui/SearchBar";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FileUploadModal from "@/features/inventory/components/FileUploadModal";
import ImportPreviewModal from "@/features/inventory/components/ImportPreviewModal";
import ImportResultModal from "@/features/inventory/components/ImportResultModal";

const columns: Column<InventoryItem>[] = [
  {
    key: "name",
    header: "부품명",
    render: (item) => (
      <Link href={`/inventory/${item.id}`} className="font-medium text-[var(--primary)] hover:underline">
        {item.name}
      </Link>
    ),
  },
  { key: "category", header: "카테고리", render: (item) => item.category },
  {
    key: "quantity",
    header: "수량",
    align: "right",
    render: (item) => (
      <span className={item.quantity <= item.minQuantity ? "text-[var(--destructive)] font-bold" : ""}>{item.quantity}</span>
    ),
  },
  {
    key: "minQuantity",
    header: "최소수량",
    align: "right",
    render: (item) => <span className="text-[var(--muted-foreground)]">{item.minQuantity}</span>,
  },
  { key: "unitPrice", header: "단가", align: "right", render: (item) => formatCurrency(item.unitPrice) },
  {
    key: "status",
    header: "상태",
    render: (item) => <StatusBadge status={item.quantity <= item.minQuantity ? "LOW_STOCK" : "IN_STOCK"} />,
  },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // 임포트/엑스포트 상태
  const [showUpload, setShowUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const allCategories = Array.from(
    new Set([...CATEGORIES, ...allItems.map((i) => i.category)])
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInventory(search, category);
      setItems(data);
      if (!category && !search) setAllItems(data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [search, category]);

  useEffect(() => {
    load();
  }, [category]);

  // 파일 선택 → 미리보기 요청
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setShowUpload(false);
    try {
      const preview = await previewImport(file);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // 임포트 확인
  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const result = await importFile(selectedFile);
      setImportResult(result);
      setShowPreview(false);
      setShowResult(true);
      // 데이터 새로고침
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  // Excel 다운로드
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportInventory();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <div className="flex items-center gap-2">
          {/* Excel 다운로드 */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="glass-btn rounded-lg px-3 py-2 text-sm disabled:opacity-50 flex items-center gap-1.5"
            title="Excel 백업 다운로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {exporting ? "다운로드 중..." : "Excel 백업"}
          </button>

          {/* CSV/Excel 업로드 */}
          <button
            onClick={() => setShowUpload(true)}
            className="glass-btn rounded-lg px-3 py-2 text-sm flex items-center gap-1.5"
            title="CSV/Excel 파일 업로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            파일 업로드
          </button>

          {/* 부품 등록 */}
          <Link
            href="/inventory/new"
            className="glass-btn rounded-lg px-4 py-2 text-sm font-medium"
          >
            + 부품 등록
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} onSearch={load} placeholder="부품명 검색..." />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyTitle="등록된 부품이 없습니다."
        emptyDescription="부품을 등록하거나 CSV/Excel 파일을 업로드하여 재고를 관리하세요."
      />

      {/* 모달들 */}
      <FileUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onFileSelected={handleFileSelected}
      />
      <ImportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        onConfirmImport={handleConfirmImport}
        importing={importing}
      />
      <ImportResultModal
        open={showResult}
        onClose={() => {
          setShowResult(false);
          setImportResult(null);
          setSelectedFile(null);
          setPreviewData(null);
        }}
        result={importResult}
      />
    </div>
  );
}
