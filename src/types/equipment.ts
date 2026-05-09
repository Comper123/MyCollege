import { Room } from "@/lib/db/schema";
import { Equipment, EquipmentLot, EquipmentMovement, EquipmentType } from "@/lib/db/schema/equipment";
import { User } from "@/lib/db/schema/users";

export interface FullEquipment extends Equipment {
  equipmentType: EquipmentType;
  room: Room | null;
  responsible: User | null;
  lot: FullLot | null;
  attributes: Record<string, string | number | boolean> | null;
}

export interface FullLot extends EquipmentLot {
  equipmentType: EquipmentType;
  acceptedBy: User | null;
  items: FullEquipment[];
}

export interface FullMovement extends EquipmentMovement {
  equipment: FullEquipment;
  fromRoom: Room | null;
  toRoom: Room | null;
  movedBy: User | null;
}

export interface EquipmentForm {
  name: string;
  equipmentTypeId: string;
  lotId?: string;
  roomId?: string;
  responsibleId?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  status?: string;
  notes?: string;
  attributes?: Record<string, string | number>;
}

export const emptyEquipmentForm: EquipmentForm = {
  name: "",
  equipmentTypeId: "",
};

export interface LotForm {
  name: string;
  equipmentTypeId: string;
  quantity: number;
  supplier?: string;
  invoiceNumber?: string;
  unitPriceCents?: number;
  roomId?: string;
  responsibleId?: string;
  baseAttributes?: Record<string, string | number>;
}

export const emptyLotForm: LotForm = {
  name: "",
  equipmentTypeId: "",
  quantity: 1,
};