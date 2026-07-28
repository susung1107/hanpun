import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import { fetchMonthlyStats, fetchYearlyStats } from '../api/stats';

/** 월 통계 — 홈 요약·통계 화면·캘린더 일별 합계에 사용 */
export function useMonthlyStats(month: string) {
  return useQuery({
    queryKey: queryKeys.stats.monthly(month),
    queryFn: () => fetchMonthlyStats(month),
  });
}

export function useYearlyStats(year: number) {
  return useQuery({
    queryKey: queryKeys.stats.yearly(year),
    queryFn: () => fetchYearlyStats(year),
  });
}
