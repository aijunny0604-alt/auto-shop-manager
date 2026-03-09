import type { Customer } from "@/types/customer";

const BASE = "/api/customers";

export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${BASE}${params}`);
  return res.json();
}

export async function fetchCustomer(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  return res.json();
}

export async function createCustomer(data: { name: string; phone?: string; memo?: string }): Promise<Customer> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function updateCustomer(id: string, data: { name?: string; phone?: string; memo?: string }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteCustomer(id: string) {
  await fetch(`${BASE}/${id}`, { method: "DELETE" });
}

export async function createVehicle(customerId: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/${customerId}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteVehicle(vehicleId: string) {
  await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
}

export async function createServiceRecord(vehicleId: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/vehicles/${vehicleId}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteServiceRecord(serviceId: string) {
  await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
}
