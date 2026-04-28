import { Room, User } from "@/lib/db/schema";


export interface FullRoom extends Omit<Room, 'attached_teacher' | 'attached_lab'> {
  attechedTeacher: User,
  attachedLaborant: User
}

export interface RoomForm {
  number: string;
  description?: string;
  teacher_id?: string;
  laborant_id?: string;
}

export const emptyRoomForm: RoomForm = {
  number: '',
  description: '',
  teacher_id: '',
  laborant_id: ''
}