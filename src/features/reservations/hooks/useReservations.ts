"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reservation, CreateReservationInput } from "@/types/reservation";
import {
  fetchReservations,
  fetchReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  checkCalendarConnection,
} from "@/features/reservations/api";

// ---------------------------------------------------------------------------
// useReservationList
// ---------------------------------------------------------------------------

interface UseReservationListOptions {
  from?: string;
  to?: string;
}

export function useReservationList(options: UseReservationListOptions = {}) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservations(options.from, options.to);
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [options.from, options.to]);

  useEffect(() => {
    load();
  }, [load]);

  return { reservations, loading, error, refresh: load };
}

// ---------------------------------------------------------------------------
// useReservation
// ---------------------------------------------------------------------------

export function useReservation(id: string) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservation(id);
      setReservation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (data: Partial<Reservation>) => {
      const updated = await updateReservation(id, data);
      setReservation(updated);
      return updated;
    },
    [id]
  );

  const remove = useCallback(async () => {
    await deleteReservation(id);
  }, [id]);

  return { reservation, loading, error, update, remove, refresh: load };
}

// ---------------------------------------------------------------------------
// useCreateReservation
// ---------------------------------------------------------------------------

export function useCreateReservation() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateReservationInput) => {
    setSubmitting(true);
    setError(null);
    try {
      return await createReservation(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "예약 생성에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, submitting, error };
}

// ---------------------------------------------------------------------------
// useCalendarSync
// ---------------------------------------------------------------------------

export function useCalendarSync() {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    calendarEventsFound: number;
    reservationsLinked: number;
    orphanedReservations: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCalendarConnection().then(setConnected);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "동기화에 실패했습니다.");
      }
      setSyncResult(data.summary);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google Calendar 동기화에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { connected, syncing, syncResult, error, sync };
}
