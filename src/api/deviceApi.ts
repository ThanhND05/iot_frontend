import axiosClient from './axiosClient';
import type { ApiResponse, DeviceItem, ActionResponse } from './types';

export type { DeviceItem, ActionResponse };

export const deviceApi = {
  getAllDevices: async (): Promise<ApiResponse<DeviceItem[]>> => {
    return (await axiosClient.get('/devices')) as unknown as ApiResponse<DeviceItem[]>;
  },

  performAction: async (deviceId: number, action: 'ON' | 'OFF', userId: number = 1): Promise<ApiResponse<ActionResponse>> => {
    return (await axiosClient.post(`/devices/${deviceId}/actions`, {
      userId,
      action,
    })) as unknown as ApiResponse<ActionResponse>;
  },
};
