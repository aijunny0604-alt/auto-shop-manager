export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  vehicles?: Vehicle[];
  _count?: { vehicles: number; reservations: number };
}

export interface Vehicle {
  id: string;
  customerId: string;
  carModel: string;
  year: number | null;
  plateNumber: string | null;
  mileage: number | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  serviceRecords?: ServiceRecord[];
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: string;
  description: string;
  cost: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  partsUsed?: ServicePartUsed[];
}

export interface ServicePartUsed {
  id: string;
  serviceRecordId: string;
  inventoryItemId: string;
  quantity: number;
  inventoryItem?: { name: string; category: string };
}

export const SERVICE_TYPES = ["정비", "튜닝", "점검", "기타"] as const;
