import type { PersonalRule } from '@hanpun/shared';
import { formatBudgetWon, formatCompactWon } from '@hanpun/shared';

import { planCategoryMemory, suggestCategory } from '../src/lib/classify';
import { mockApi } from '../src/mocks/api';

describe('금액 축약 표기', () => {
  it('만·억 단위로 줄인다', () => {
    expect(formatCompactWon(4500)).toBe('4,500원');
    expect(formatCompactWon(45000)).toBe('4.5만원');
    expect(formatCompactWon(1284500)).toBe('128만원');
    expect(formatCompactWon(320000000)).toBe('3.2억원');
  });

  it("unit: false 면 '원' 을 뺀다 (캘린더 칸)", () => {
    const cell = { unit: false, exactBelow: 1_000_000 } as const;
    expect(formatCompactWon(45000, cell)).toBe('45,000');
    expect(formatCompactWon(1284500, cell)).toBe('128만');
  });

  it('예산 표기는 만 단위로 딱 떨어질 때만 줄인다', () => {
    expect(formatBudgetWon(2000000)).toBe('200만원');
    expect(formatBudgetWon(2004500)).toBe('2,004,500원');
    expect(formatBudgetWon(5000)).toBe('5,000원');
  });
});

describe('자동분류 개인 규칙 기억 판단', () => {
  const rules: PersonalRule[] = [];

  it('사전이 이미 같은 결론을 내면 규칙을 만들지 않는다', () => {
    const suggestion = suggestCategory('스타벅스 아메리카노', 'expense', rules);
    expect(
      planCategoryMemory({
        title: '스타벅스 아메리카노',
        type: 'expense',
        categoryId: suggestion.categoryId,
        rules,
      }),
    ).toBeNull();
  });

  it('사전과 다른 카테고리를 고르면 규칙으로 기억한다', () => {
    const plan = planCategoryMemory({
      title: '동네정육점',
      type: 'expense',
      categoryId: 'food',
      rules,
    });
    expect(plan).toEqual({ keyword: '동네정육점', categoryId: 'food', replaces: undefined });
  });

  it('한 글자 내역은 규칙이 너무 넓어 기억하지 않는다', () => {
    expect(
      planCategoryMemory({ title: '커', type: 'expense', categoryId: 'transport', rules }),
    ).toBeNull();
  });

  it('같은 키워드의 기존 규칙은 교체 대상으로 표시한다', () => {
    const existing: PersonalRule[] = [
      { id: 'rule-1', keyword: '동네정육점', categoryId: 'shopping', createdAt: '2026-07-01' },
    ];
    const plan = planCategoryMemory({
      title: '동네정육점',
      type: 'expense',
      categoryId: 'food',
      rules: existing,
    });
    expect(plan?.replaces).toBe('rule-1');
  });

  it('타입에 없는 카테고리는 거른다 (수입 거래에 지출 카테고리)', () => {
    expect(
      planCategoryMemory({ title: '월급날', type: 'income', categoryId: 'food', rules }),
    ).toBeNull();
  });
});

describe('월간 통계 byDay 계약', () => {
  it('거래가 없는 날도 0으로 채워 그 달의 모든 날짜를 준다', async () => {
    const stats = await mockApi.getMonthlyStats('2026-02');
    expect(stats.byDay).toHaveLength(28);
    expect(stats.byDay[0]!.date).toBe('2026-02-01');
    expect(stats.byDay[27]!.date).toBe('2026-02-28');
    stats.byDay.forEach(day => {
      expect(day.expense).toBeGreaterThanOrEqual(0);
      expect(day.income).toBeGreaterThanOrEqual(0);
    });
  });

  it('31일 달은 31칸이다', async () => {
    const stats = await mockApi.getMonthlyStats('2026-07');
    expect(stats.byDay).toHaveLength(31);
    expect(stats.byDay[30]!.date).toBe('2026-07-31');
  });
});
