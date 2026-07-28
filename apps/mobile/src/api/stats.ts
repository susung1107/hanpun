import type { MonthlyStats, YearlyStats } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export async function fetchMonthlyStats(month: string): Promise<MonthlyStats> {
  if (USE_MOCK_API) {
    return mockApi.getMonthlyStats(month);
  }
  const { data } = await apiClient.get<MonthlyStats>('/stats/monthly', { params: { month } });
  return data;
}

export async function fetchYearlyStats(year: number): Promise<YearlyStats> {
  if (USE_MOCK_API) {
    return mockApi.getYearlyStats(year);
  }
  const { data } = await apiClient.get<YearlyStats>('/stats/yearly', { params: { year } });
  return data;
}
