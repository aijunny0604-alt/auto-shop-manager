"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerAutocomplete from "@/components/ui/CustomerAutocomplete";
import { createEstimate } from "@/features/estimates/api";
import { useAppStore } from "@/store/useAppStore";
import type { Customer } from "@/types/customer";

interface ItemRow {
  type: "LABOR" | "PART";
  name: string;
  quantity: number;
  unitPrice: number;
  memo: string;
}

export default function NewEstimatePage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [vehicles, setVehicles] = useState<{ id: string; carModel: string; plateNumber?: string | null }[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [memo, setMemo] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { type: "LABOR", name: "", quantity: 1, unitPrice: 0, memo: "" },
  ]);

  // 재고 목록 (부품 선택용)
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unitPrice: number; category: string }[]>([]);

  useEffect(() => {
    fetch("/api/inventory?limit=500")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInventoryItems(data);
      })
      .catch(() => {});
  }, []);

  // 고객 선택 시 차량 로드
  useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/customers/${selectedCustomer.id}`)
        .then((r) => r.json())
        .then((data) => setVehicles(data.vehicles || []))
        .catch(() => setVehicles([]));
    } else {
      setVehicles([]);
      setVehicleId("");
    }
  }, [selectedCustomer]);

  const addItem = (type: "LABOR" | "PART") => {
    setItems([...items, { type, name: "", quantity: 1, unitPrice: 0, memo: "" }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: string | number) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);

  const formatCurrency = (n: number) => n.toLocaleString("ko-KR");

  const handleSubmit = async () => {
    const resolvedCustomerName = newCustomerName || (customerQuery.trim() || null);
    if (!selectedCustomer && !resolvedCustomerName) {
      addToast("고객을 선택하거나 이름을 입력해주세요.", "error");
      return;
    }
    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      addToast("항목을 1개 이상 입력해주세요.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        vehicleId: vehicleId || null,
        discount,
        memo: memo || null,
        validUntil: validUntil || null,
        items: validItems.map((item) => ({
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          memo: item.memo || null,
        })),
      };

      if (selectedCustomer) {
        payload.customerId = selectedCustomer.id;
      } else {
        payload.customerName = resolvedCustomerName;
        payload.customerPhone = newCustomerPhone || undefined;
      }

      await createEstimate(payload);
      addToast(
        resolvedCustomerName
          ? `"${resolvedCustomerName}" 고객 등록 + 견적서 작성 완료!`
          : "견적서가 작성되었습니다.",
        "success"
      );
      router.push("/estimates");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "작성 실패", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "glass-input w-full rounded-lg px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">견적서 작성</h1>

      <div className="space-y-4">
        {/* 고객 선택 */}
        <div>
          <label className="block text-sm font-medium mb-1">고객 *</label>
          <CustomerAutocomplete
            selectedCustomer={selectedCustomer}
            onSelect={(c) => {
              setSelectedCustomer(c);
              setNewCustomerName(null);
              setCustomerQuery("");
              setNewCustomerPhone("");
            }}
            onNewCustomer={(name) => {
              setSelectedCustomer(null);
              setNewCustomerName(name);
              setCustomerQuery("");
            }}
            onQueryChange={(q) => setCustomerQuery(q)}
            onClear={() => {
              setSelectedCustomer(null);
              setNewCustomerName(null);
              setCustomerQuery("");
              setNewCustomerPhone("");
              setVehicles([]);
              setVehicleId("");
            }}
          />
        </div>

        {/* 신규 고객 정보 입력 */}
        {(newCustomerName || (!selectedCustomer && customerQuery.trim())) && (
          <div className="glass-card rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-[var(--primary)]">
              신규 고객: {newCustomerName || customerQuery.trim()}
            </p>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                전화번호 (선택)
              </label>
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* 차량 선택 */}
        {vehicles.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">차량</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={inputClass}
            >
              <option value="">선택 안함</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.carModel}{v.plateNumber ? ` (${v.plateNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 항목 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">항목 *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addItem("LABOR")}
                className="rounded px-3 py-1 text-xs bg-[var(--secondary)] hover:bg-[var(--accent)]"
              >
                + 공임
              </button>
              <button
                type="button"
                onClick={() => addItem("PART")}
                className="rounded px-3 py-1 text-xs bg-[var(--secondary)] hover:bg-[var(--accent)]"
              >
                + 부품
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.type === "LABOR"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.type === "LABOR" ? "공임" : "부품"}
                  </span>
                  <div className="flex-1">
                    {item.type === "PART" ? (
                      <select
                        value={item.name}
                        onChange={(e) => {
                          const selected = inventoryItems.find((inv) => inv.name === e.target.value);
                          updateItem(idx, "name", e.target.value);
                          if (selected) {
                            updateItem(idx, "unitPrice", selected.unitPrice);
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">부품 선택...</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.name}>
                            {inv.name} ({inv.category}) - {inv.unitPrice.toLocaleString()}원
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        placeholder="작업 항목명 (예: 엔진오일 교환 공임)"
                        className={inputClass}
                      />
                    )}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-[var(--destructive)] text-sm px-2 hover:bg-[var(--destructive)]/10 rounded"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)]">수량</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)]">단가 (원)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Math.max(0, parseInt(e.target.value) || 0))}
                      min={0}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)]">금액</label>
                    <p className="px-3 py-2 text-sm font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}원
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 합계 */}
        <div className="glass-card p-4">
          <div className="flex justify-between text-sm mb-1">
            <span>소계</span>
            <span>{formatCurrency(subtotal)}원</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span>할인</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              className="glass-input w-32 rounded px-2 py-1 text-sm text-right"
            />
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-[var(--border)] pt-2">
            <span>합계</span>
            <span>{formatCurrency(total)}원</span>
          </div>
        </div>

        {/* 메모 & 유효기간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">유효기간</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비고</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항"
              className={inputClass}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="glass-btn rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "견적서 저장"}
          </button>
          <button
            onClick={() => router.back()}
            className="glass-card rounded-lg px-6 py-2 text-sm hover:bg-[var(--accent)]"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
