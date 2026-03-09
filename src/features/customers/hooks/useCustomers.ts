"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/types/customer";
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createVehicle,
  deleteVehicle,
  createServiceRecord,
  deleteServiceRecord,
} from "@/features/customers/api";

// ---------------------------------------------------------------------------
// useCustomerList
// ---------------------------------------------------------------------------

export function useCustomerList(search?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers(search);
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "고객 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, loading, error, refresh: load };
}

// ---------------------------------------------------------------------------
// useCustomer
// ---------------------------------------------------------------------------

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomer(id);
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "고객 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (data: { name?: string; phone?: string; memo?: string }) => {
      const updated = await updateCustomer(id, data);
      setCustomer(updated);
      return updated;
    },
    [id]
  );

  const remove = useCallback(async () => {
    await deleteCustomer(id);
  }, [id]);

  return { customer, loading, error, update, remove, refresh: load };
}

// ---------------------------------------------------------------------------
// useCreateCustomer
// ---------------------------------------------------------------------------

export function useCreateCustomer() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: { name: string; phone?: string; memo?: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        return await createCustomer(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "고객 등록에 실패했습니다.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { create, submitting, error };
}

// ---------------------------------------------------------------------------
// useVehicles
// ---------------------------------------------------------------------------

export function useVehicles(customerId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addVehicle = useCallback(
    async (data: Record<string, unknown>) => {
      setSubmitting(true);
      setError(null);
      try {
        return await createVehicle(customerId, data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "차량 등록에 실패했습니다.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [customerId]
  );

  const removeVehicle = useCallback(async (vehicleId: string) => {
    await deleteVehicle(vehicleId);
  }, []);

  return { addVehicle, removeVehicle, submitting, error };
}

// ---------------------------------------------------------------------------
// useServiceRecords
// ---------------------------------------------------------------------------

export function useServiceRecords(vehicleId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addServiceRecord = useCallback(
    async (data: Record<string, unknown>) => {
      setSubmitting(true);
      setError(null);
      try {
        return await createServiceRecord(vehicleId, data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "정비 이력 등록에 실패했습니다.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [vehicleId]
  );

  const removeServiceRecord = useCallback(async (serviceId: string) => {
    await deleteServiceRecord(serviceId);
  }, []);

  return { addServiceRecord, removeServiceRecord, submitting, error };
}
