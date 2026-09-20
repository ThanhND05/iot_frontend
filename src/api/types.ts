export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LatestDataSensorResponse {
  temperature: number | null;
  humidity: number | null;
  light: number | null;
  timestamp: string | null;
}

export interface DataSensorItem {
  id: number;
  sensorId: number;
  sensorType: string;
  value: string;
  createdAt: string;
}

export interface DeviceItem {
  id: number;
  name: string;
  lastAction?: 'ON' | 'OFF' | string;
  status?: string;
  lastUpdatedAt?: string;
}

export interface ActionResponse {
  id: number;
  deviceId: number;
  deviceName: string;
  userId: number;
  action: 'ON' | 'OFF' | string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
  createdAt: string;
}
