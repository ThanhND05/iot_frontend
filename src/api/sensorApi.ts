import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse, LatestDataSensorResponse, DataSensorItem } from './types';

export type { ApiResponse, PageResponse, LatestDataSensorResponse, DataSensorItem };

export interface SearchSensorParams {
  page?: number;
  size?: number;
  type?: string;
  time?: string;
}

export const sensorApi = {
  getLatest: async (): Promise<ApiResponse<LatestDataSensorResponse>> => {
    return (await axiosClient.get('/datasensors/latest')) as unknown as ApiResponse<LatestDataSensorResponse>;
  },

  getChartData: async (): Promise<ApiResponse<LatestDataSensorResponse[]>> => {
    return (await axiosClient.get('/datasensors/chart/latest')) as unknown as ApiResponse<LatestDataSensorResponse[]>;
  },

  search: async (params: SearchSensorParams): Promise<ApiResponse<PageResponse<DataSensorItem>>> => {
    return (await axiosClient.get('/datasensors', { params })) as unknown as ApiResponse<PageResponse<DataSensorItem>>;
  },
};
