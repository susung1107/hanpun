import {
  buildCalendarGrid,
  calendarWeeks,
  formatAmountKo,
  formatDateShort,
  formatMonthLong,
  getCategory,
  shiftMonth,
  toMonthKey,
} from '@hanpun/shared';

describe('금액 포맷', () => {
  it('원 단위 천 단위 구분자를 넣고 원을 붙인다', () => {
    expect(formatAmountKo(1234567)).toBe('1,234,567원');
  });
});

describe('날짜 유틸', () => {
  it('월 키를 만들고 이동한다', () => {
    expect(toMonthKey(new Date('2026-07-22T00:00:00'))).toBe('2026-07');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('한국어 라벨을 만든다', () => {
    expect(formatMonthLong('2026-07')).toBe('2026년 7월');
    expect(formatDateShort('2026-07-22')).toContain('7월 22일');
  });

  it('캘린더 그리드는 그 달에 필요한 주 수만 만든다', () => {
    // 2026-07-01 은 수요일 → 3 + 31 = 34칸 → 5주
    expect(calendarWeeks('2026-07')).toBe(5);
    const grid = buildCalendarGrid('2026-07');
    expect(grid).toHaveLength(35);
    expect(grid.filter(cell => cell.inCurrentMonth)).toHaveLength(31);

    // 2026-08-01 은 토요일 → 6 + 31 = 37칸 → 6주
    expect(calendarWeeks('2026-08')).toBe(6);
    expect(buildCalendarGrid('2026-08')).toHaveLength(42);

    // 2026-02-01 은 일요일이고 28일 → 정확히 4주
    expect(calendarWeeks('2026-02')).toBe(4);
  });

  it('주 수를 고정하면 그만큼 만든다 (날짜 선택 시트)', () => {
    expect(buildCalendarGrid('2026-07', 6)).toHaveLength(42);
  });
});

describe('카테고리 조회', () => {
  it('알 수 없는 id 는 기타로 폴백한다', () => {
    expect(getCategory('food').label).toBe('식비');
    expect(getCategory('없는카테고리').id).toBe('etc');
  });
});
