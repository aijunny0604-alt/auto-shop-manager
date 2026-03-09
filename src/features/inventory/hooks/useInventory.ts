"use client";

import { useState, useEffect, useCallback } from "react";
import type { InventoryItem } from "@/types/inventory";
import {
  fetchInventory,
  fetchInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockLog,
  fetchLowStockItems,
} from "@/features/inventory/api";
import type { CreateInventoryInput, StockLogInput } from "@/types/inventory";

// ---------------------------------------------------------------------------
// useInventoryList
// ---------------------------------------------------------------------------

interface UseInventoryListOptions {
  search?: string;
  category?: string;
}

export function useInventoryList(options: UseInventoryListOptions = {}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventory(options.search, options.category);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재고 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [options.search, options.category]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

// ---------------------------------------------------------------------------
// useInventoryItem
// ---------------------------------------------------------------------------

export function useInventoryItem(id: string) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventoryItem(id);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재고 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (data: Partial<CreateInventoryInput>) => {
      const updated = await updateInventoryItem(id, data);
      setItem(updated);
      return updated;
    },
    [id]
  );

  const remove = useCallback(async () => {
    await deleteInventoryItem(id);
  }, [id]);

  return { item, loading, error, update, remove, refresh: load };
}

// ---------------------------------------------------------------------------
// useStockLog
// ---------------------------------------------------------------------------

export function useStockLog(itemId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback(
    async (data: StockLogInput) => {
      setSubmitting(true);
      setError(null);
      try {
        return await createStockLog(itemId, data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "입출고 기록에 실패했습니다.";
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [itemId]
  );

  return { addLog, submitting, error };
}

// ---------------------------------------------------------------------------
// useLowStockItems
// ---------------------------------------------------------------------------

export function useLowStockItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLowStockItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재고 알림 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

// ---------------------------------------------------------------------------
// useCreateInventoryItem
// ---------------------------------------------------------------------------

export function useCreateInventoryItem() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateInventoryInput) => {
    setSubmitting(true);
    setError(null);
    try {
      return await createInventoryItem(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "부품 등록에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, submitting, error };
}
