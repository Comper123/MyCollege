export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  maintenanceEquipment: number;
  brokenEquipment: number;
  totalRooms: number;
  occupiedRooms: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalUsers: number;
  activeUsers: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

export interface ActivityItem {
  id: string;
  type: 'equipment_added' | 'equipment_moved' | 'request_created' | 'request_completed' | 'user_joined';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  icon: string;
}

export interface EquipmentStatusData {
  status: string;
  count: number;
  color: string;
}

export interface RequestTrendData {
  date: string;
  created: number;
  completed: number;
}