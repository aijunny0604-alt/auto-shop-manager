import type { Reservation, CreateReservationInput } from "@/types/reservation";

const BASE = "/api/reservations";

export async function fetchReservations(from?: string, to?: string): Promise<Reservation[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE}?${params}`);
  return res.json();
}

export async function fetchReservation(id: string): Promise<Reservation> {
  const res = await fetch(`${BASE}/${id}`);
  return res.json();
}

export async function createReservation(data: CreateReservationInput): Promise<Reservation> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteReservation(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: "DELETE" });
}

export async function checkCalendarConnection(): Promise<boolean> {
  try {
    const res = await fetch("/api/calendar/status");
    const data = await res.json();
    return data.connected;
  } catch {
    return false;
  }
}
