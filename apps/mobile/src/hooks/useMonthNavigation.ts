import { useCallback, useState } from 'react';
import { shiftMonth, toMonthKey } from '@hanpun/shared';

/**
 * 월 단위로 앞뒤 이동하는 화면(홈·캘린더·통계·예산)의 공통 상태.
 * 미래 월로는 이동하지 않는다(기획: 아직 오지 않은 달은 볼 수 없음).
 */
export function useMonthNavigation(initialMonth?: string) {
  const currentMonth = toMonthKey(new Date());
  const [month, setMonth] = useState(initialMonth ?? currentMonth);

  const goPrev = useCallback(() => {
    setMonth(prev => shiftMonth(prev, -1));
  }, []);

  const goNext = useCallback(() => {
    setMonth(prev => {
      const next = shiftMonth(prev, 1);
      return next > currentMonth ? prev : next;
    });
  }, [currentMonth]);

  const canGoNext = month < currentMonth;
  const isCurrentMonth = month === currentMonth;

  return { month, setMonth, goPrev, goNext, canGoNext, isCurrentMonth, currentMonth };
}
