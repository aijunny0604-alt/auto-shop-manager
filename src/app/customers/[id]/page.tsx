"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  fetchCustomer,
  updateCustomer,
  deleteCustomer,
  createVehicle,
  deleteVehicle,
  createServiceRecord,
  deleteServiceRecord,
} from "@/features/customers/api";
import { SERVICE_TYPES } from "@/types/customer";
import type { Vehicle, ServiceRecord } from "@/types/customer";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const data = await fetchCustomer(id);
    setCustomer(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("고객과 관련된 모든 데이터가 삭제됩니다. 계속하시겠습니까?")) return;
    await deleteCustomer(id);
    router.push("/customers");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await updateCustomer(id, {
      name: form.get("name") as string,
      phone: (form.get("phone") as string) || undefined,
      memo: (form.get("memo") as string) || undefined,
    });
    setEditing(false);
    load();
  };

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createVehicle(id, {
      carModel: form.get("carModel"),
      year: form.get("year") || null,
      plateNumber: form.get("plateNumber") || null,
      mileage: form.get("mileage") || null,
      memo: form.get("memo") || null,
    });
    setShowVehicleForm(false);
    load();
  };

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>, vehicleId: string) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createServiceRecord(vehicleId, {
      serviceDate: form.get("serviceDate"),
      serviceType: form.get("serviceType"),
      description: form.get("description"),
      cost: form.get("cost"),
      memo: form.get("memo") || null,
    });
    setShowServiceForm(null);
    load();
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">로딩 중...</p>;
  if (!customer) return <p>고객을 찾을 수 없습니다.</p>;

  const vehicles = (customer.vehicles as Vehicle[]) || [];

  return (
    <div className="max-w-3xl">
      {/* 고객 정보 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{customer.name as string}</h1>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]">{editing ? "취소" : "수정"}</button>
          <button onClick={handleDelete} className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-sm text-white hover:opacity-90">삭제</button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="space-y-3 mb-6 rounded-lg border border-[var(--border)] p-4">
          <input name="name" defaultValue={customer.name as string} required className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <input name="phone" defaultValue={(customer.phone as string) || ""} placeholder="연락처" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <textarea name="memo" defaultValue={(customer.memo as string) || ""} rows={2} placeholder="메모" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]">저장</button>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-[var(--border)] p-4 grid grid-cols-2 gap-3">
          <div><span className="text-xs text-[var(--muted-foreground)]">연락처</span><p className="font-medium">{(customer.phone as string) || "-"}</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">메모</span><p className="font-medium">{(customer.memo as string) || "-"}</p></div>
        </div>
      )}

      {/* 차량 목록 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">차량 목록</h2>
        <button onClick={() => setShowVehicleForm(!showVehicleForm)} className="text-sm text-[var(--primary)] hover:underline">
          {showVehicleForm ? "취소" : "+ 차량 추가"}
        </button>
      </div>

      {showVehicleForm && (
        <form onSubmit={handleAddVehicle} className="mb-4 rounded-lg border border-[var(--border)] p-4 space-y-3">
          <input name="carModel" required placeholder="차종 (예: 현대 아반떼 CN7)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <input name="year" type="number" placeholder="연식" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            <input name="plateNumber" placeholder="번호판" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            <input name="mileage" type="number" placeholder="주행거리(km)" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)]">등록</button>
        </form>
      )}

      {vehicles.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] mb-6">등록된 차량이 없습니다.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {vehicles.map((v: Vehicle) => (
            <div key={v.id} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{v.carModel}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {v.year && `${v.year}년식`} {v.plateNumber && `| ${v.plateNumber}`} {v.mileage && `| ${v.mileage.toLocaleString()}km`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowServiceForm(showServiceForm === v.id ? null : v.id)} className="text-xs text-[var(--primary)] hover:underline">+ 정비 기록</button>
                  <button onClick={async () => { if (confirm("차량을 삭제하시겠습니까?")) { await deleteVehicle(v.id); load(); } }} className="text-xs text-[var(--destructive)] hover:underline">삭제</button>
                </div>
              </div>

              {showServiceForm === v.id && (
                <form onSubmit={(e) => handleAddService(e, v.id)} className="mt-3 space-y-3 rounded-lg bg-[var(--muted)] p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input name="serviceDate" type="date" required className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                    <select name="serviceType" required className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                      {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input name="description" required placeholder="작업 내용" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="cost" type="number" placeholder="비용 (원)" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                    <input name="memo" placeholder="메모" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
                  </div>
                  <button type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm text-[var(--primary-foreground)]">등록</button>
                </form>
              )}

              {/* 정비 이력 */}
              {v.serviceRecords && v.serviceRecords.length > 0 && (
                <div className="mt-3 space-y-2">
                  {v.serviceRecords.map((sr: ServiceRecord) => (
                    <div key={sr.id} className="flex items-center justify-between rounded bg-[var(--muted)] px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--primary)] px-1.5 py-0.5 text-xs text-[var(--primary-foreground)]">{sr.serviceType}</span>
                        <span>{sr.description}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                        <span>{formatCurrency(sr.cost)}</span>
                        <span>{formatDate(sr.serviceDate)}</span>
                        <button onClick={async () => { if (confirm("삭제하시겠습니까?")) { await deleteServiceRecord(sr.id); load(); } }} className="text-[var(--destructive)] hover:underline">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
