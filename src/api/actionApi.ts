import axiosClient from './axiosClient';
import type { ApiResponse, PageResponse, ActionResponse } from './types';

export interface SearchActionParams {
  page?: number;
  size?: number;
  device?: string;
  time?: string;
}

export const actionApi = {
  searchActions: async (params: SearchActionParams): Promise<ApiResponse<PageResponse<ActionResponse>>> => {
    return (await axiosClient.get('/actions', { params })) as unknown as ApiResponse<PageResponse<ActionResponse>>;
  },
};
