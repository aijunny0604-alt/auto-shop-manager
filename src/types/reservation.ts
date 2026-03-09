import type { Customer } from "./customer";
import type { Vehicle } from "./customer";

export interface Reservation {
  id: string;
  customerId: string;
  vehicleId: string | null;
  scheduledAt: string;
  duration: number;
  serviceType: string;
  description: string | null;
  status: ReservationStatus;
  calendarEventId: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  vehicle?: Vehicle;
}

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface CreateReservationInput {
  customerId: string;
  vehicleId?: string;
  scheduledAt: string;
  duration?: number;
  serviceType: string;
  description?: string;
  memo?: string;
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  COMPLETED: "완료",
  CANCELLED: "취소",
};
