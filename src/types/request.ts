import { Request, User } from "@/lib/db/schema";
import { FullEquipment } from "./equipment";

// Расширенный тип для заявки (со связями)
export interface RequestWithRelations extends Request {
  equipment: FullEquipment | null;
  createdBy: User;
  assignedTo: User | null;
}
