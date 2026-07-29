import { useCallback, useMemo, useState } from 'react';
import { shiftMonth, toMonthKey } from '@hanpun/shared';

interface Options {
  /** 처음 보여줄 달 (생략하면 이번 달) */
  initialMonth?: string;
  /**
   * 미래로 몇 달까지 갈 수 있는가.
   *
   * 기본값 0 — 통계·예산은 아직 오지 않은 달을 볼 이유가 없다(기획).
   * 캘린더만 예외다: 반복거래로 **예정된 고정지출**을 미리 보여주므로 앞으로 갈 수 있어야 한다.
   */
  maxFutureMonths?: number;
}

/**
 * 월 단위로 앞뒤 이동하는 화면(홈·캘린더·통계·예산)의 공통 상태.
 */
export function useMonthNavigation(options?: string | Options) {
  // 예전 시그니처가 문자열 하나(initialMonth)였다 — 기존 호출부를 깨지 않는다
  const { initialMonth, maxFutureMonths = 0 } =
    typeof options === 'string' ? { initialMonth: options, maxFutureMonths: 0 } : options ?? {};

  const currentMonth = toMonthKey(new Date());
  const [month, setMonth] = useState(initialMonth ?? currentMonth);

  const lastMonth = useMemo(
    () => shiftMonth(currentMonth, maxFutureMonths),
    [currentMonth, maxFutureMonths],
  );

  const goPrev = useCallback(() => {
    setMonth(prev => shiftMonth(prev, -1));
  }, []);

  const goNext = useCallback(() => {
    setMonth(prev => {
      const next = shiftMonth(prev, 1);
      return next > lastMonth ? prev : next;
    });
  }, [lastMonth]);

  const goToday = useCallback(() => {
    setMonth(currentMonth);
  }, [currentMonth]);

  const canGoNext = month < lastMonth;
  const isCurrentMonth = month === currentMonth;

  return { month, setMonth, goPrev, goNext, goToday, canGoNext, isCurrentMonth, currentMonth };
}
