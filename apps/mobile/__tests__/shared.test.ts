import {
  buildCalendarGrid,
  formatDateShort,
  formatMonthLong,
  formatWon,
  getCategory,
  shiftMonth,
  toMonthKey,
} from '@hanpun/shared';

describe('금액 포맷', () => {
  it('원 단위 천 단위 구분자를 넣는다', () => {
    expect(formatWon(1234567)).toContain('1,234,567');
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

  it('캘린더 그리드는 항상 6주 42칸이다', () => {
    const grid = buildCalendarGrid('2026-07');
    expect(grid).toHaveLength(42);
    expect(grid.filter(cell => cell.inCurrentMonth)).toHaveLength(31);
  });
});

describe('카테고리 조회', () => {
  it('알 수 없는 id 는 기타로 폴백한다', () => {
    expect(getCategory('food').label).toBe('식비');
    expect(getCategory('없는카테고리').id).toBe('etc');
  });
});
