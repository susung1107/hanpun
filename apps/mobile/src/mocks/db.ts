import type {
  AppNotification,
  Budget,
  CategoryId,
  PersonalRule,
  RecurringRule,
  Transaction,
  TransactionType,
  User,
} from '@hanpun/shared';
import { toMonthKey } from '@hanpun/shared';

/**
 * 목(mock) 데이터베이스 — 서버(M1) 완성 전까지 UI 를 실제처럼 돌리기 위한 인메모리 저장소.
 * config.USE_MOCK_API=false 로 바꾸면 이 파일은 더 이상 사용되지 않는다.
 */

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

function iso(year: number, month1to12: number, day: number, hour = 12, minute = 0): string {
  return new Date(year, month1to12 - 1, day, hour, minute).toISOString();
}

const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth() + 1;
const prevMonthDate = new Date(thisYear, thisMonth - 2, 1);

interface SeedRow {
  day: number;
  hour: number;
  minute: number;
  type: TransactionType;
  categoryId: CategoryId;
  title: string;
  amount: number;
  recurring?: boolean;
  memo?: string;
}

const CURRENT_MONTH_ROWS: SeedRow[] = [
  { day: 1, hour: 9, minute: 5, type: 'income', categoryId: 'salary', title: '7월 급여', amount: 2_850_000, recurring: true },
  { day: 1, hour: 10, minute: 20, type: 'expense', categoryId: 'housing', title: '월세', amount: 650_000, recurring: true },
  { day: 2, hour: 8, minute: 12, type: 'expense', categoryId: 'transport', title: '지하철', amount: 1_550 },
  { day: 2, hour: 12, minute: 40, type: 'expense', categoryId: 'food', title: '김밥천국', amount: 8_500 },
  { day: 3, hour: 19, minute: 30, type: 'expense', categoryId: 'food', title: '배달의민족', amount: 23_000, memo: '친구랑 저녁' },
  { day: 4, hour: 11, minute: 0, type: 'expense', categoryId: 'shopping', title: '쿠팡', amount: 34_800 },
  { day: 5, hour: 20, minute: 10, type: 'expense', categoryId: 'culture', title: 'CGV 영화', amount: 15_000 },
  { day: 6, hour: 8, minute: 15, type: 'expense', categoryId: 'transport', title: '지하철', amount: 1_550 },
  { day: 7, hour: 14, minute: 25, type: 'expense', categoryId: 'food', title: '스타벅스', amount: 5_600 },
  { day: 8, hour: 18, minute: 45, type: 'expense', categoryId: 'health', title: '약국', amount: 12_400 },
  { day: 9, hour: 9, minute: 30, type: 'expense', categoryId: 'utility', title: '전기요금', amount: 42_300, recurring: true },
  { day: 10, hour: 13, minute: 5, type: 'expense', categoryId: 'food', title: '이마트 장보기', amount: 68_200 },
  { day: 11, hour: 21, minute: 0, type: 'expense', categoryId: 'culture', title: '넷플릭스', amount: 13_500, recurring: true },
  { day: 12, hour: 12, minute: 50, type: 'expense', categoryId: 'food', title: '점심 회식', amount: 32_000 },
  { day: 13, hour: 16, minute: 20, type: 'income', categoryId: 'sideIncome', title: '중고 판매', amount: 45_000 },
  { day: 14, hour: 8, minute: 10, type: 'expense', categoryId: 'transport', title: '택시', amount: 12_800 },
  { day: 15, hour: 19, minute: 0, type: 'expense', categoryId: 'event', title: '결혼식 축의금', amount: 100_000 },
  { day: 16, hour: 10, minute: 40, type: 'expense', categoryId: 'shopping', title: '무신사', amount: 89_000 },
  { day: 17, hour: 14, minute: 15, type: 'expense', categoryId: 'food', title: '스타벅스', amount: 4_500 },
  { day: 18, hour: 9, minute: 0, type: 'expense', categoryId: 'housing', title: '관리비', amount: 128_000 },
  { day: 19, hour: 20, minute: 30, type: 'expense', categoryId: 'food', title: '치킨', amount: 24_000 },
  { day: 20, hour: 8, minute: 5, type: 'expense', categoryId: 'transport', title: '버스', amount: 1_500 },
  { day: 21, hour: 15, minute: 0, type: 'expense', categoryId: 'health', title: '치과 검진', amount: 45_000 },
  { day: 22, hour: 8, minute: 12, type: 'expense', categoryId: 'transport', title: '지하철', amount: 1_550 },
  { day: 22, hour: 13, minute: 2, type: 'expense', categoryId: 'shopping', title: '쿠팡', amount: 17_000 },
  { day: 22, hour: 14, minute: 30, type: 'expense', categoryId: 'food', title: '스타벅스', amount: 4_500 },
  { day: 25, hour: 9, minute: 0, type: 'expense', categoryId: 'telecom', title: 'SKT 요금', amount: 59_000, recurring: true },
];

const PREV_MONTH_ROWS: SeedRow[] = [
  { day: 1, hour: 9, minute: 5, type: 'income', categoryId: 'salary', title: '급여', amount: 2_850_000, recurring: true },
  { day: 1, hour: 10, minute: 0, type: 'expense', categoryId: 'housing', title: '월세', amount: 650_000, recurring: true },
  { day: 4, hour: 12, minute: 0, type: 'expense', categoryId: 'food', title: '점심', amount: 12_000 },
  { day: 7, hour: 19, minute: 0, type: 'expense', categoryId: 'food', title: '배달', amount: 28_000 },
  { day: 9, hour: 9, minute: 0, type: 'expense', categoryId: 'utility', title: '전기요금', amount: 51_200, recurring: true },
  { day: 12, hour: 11, minute: 0, type: 'expense', categoryId: 'shopping', title: '쿠팡', amount: 124_000 },
  { day: 15, hour: 20, minute: 0, type: 'expense', categoryId: 'culture', title: '콘서트', amount: 132_000 },
  { day: 18, hour: 13, minute: 0, type: 'expense', categoryId: 'food', title: '이마트', amount: 92_400 },
  { day: 21, hour: 8, minute: 0, type: 'expense', categoryId: 'transport', title: '교통비 충전', amount: 50_000 },
  { day: 25, hour: 9, minute: 0, type: 'expense', categoryId: 'telecom', title: 'SKT 요금', amount: 59_000, recurring: true },
  { day: 27, hour: 15, minute: 0, type: 'expense', categoryId: 'health', title: '병원', amount: 38_000 },
  { day: 28, hour: 21, minute: 0, type: 'expense', categoryId: 'culture', title: '넷플릭스', amount: 13_500, recurring: true },
];

function buildTransactions(): Transaction[] {
  const rows: Transaction[] = [];

  const push = (row: SeedRow, year: number, month: number) => {
    const occurredAt = iso(year, month, row.day, row.hour, row.minute);
    rows.push({
      id: nextId('tx'),
      type: row.type,
      amount: row.amount,
      categoryId: row.categoryId,
      title: row.title,
      memo: row.memo ?? null,
      occurredAt,
      recurringRuleId: row.recurring ? 'rr-seed' : null,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });
  };

  const lastDayOfCurrentMonth = new Date(thisYear, thisMonth, 0).getDate();
  CURRENT_MONTH_ROWS.filter(row => row.day <= Math.min(now.getDate(), lastDayOfCurrentMonth)).forEach(
    row => push(row, thisYear, thisMonth),
  );
  PREV_MONTH_ROWS.forEach(row =>
    push(row, prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1),
  );

  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export interface MockDb {
  user: User;
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  budgets: Budget[];
  personalRules: PersonalRule[];
  notifications: AppNotification[];
}

export const db: MockDb = {
  user: {
    id: 'user-1',
    email: 'susung1107@gmail.com',
    nickname: '수성',
    provider: 'kakao',
    createdAt: iso(2026, 3, 2),
  },
  transactions: buildTransactions(),
  recurringRules: [
    {
      id: 'rr-1',
      type: 'expense',
      amount: 59_000,
      categoryId: 'telecom',
      title: 'SKT 요금',
      memo: null,
      cycle: 'monthly',
      dayAnchor: 25,
      month: null,
      startsAt: iso(2026, 1, 25),
      endsAt: null,
      active: true,
      lastGeneratedAt: iso(thisYear, thisMonth, 25),
      createdAt: iso(2026, 1, 20),
      updatedAt: iso(2026, 1, 20),
    },
    {
      id: 'rr-2',
      type: 'expense',
      amount: 650_000,
      categoryId: 'housing',
      title: '월세',
      memo: null,
      cycle: 'monthly',
      dayAnchor: 1,
      month: null,
      startsAt: iso(2026, 1, 1),
      endsAt: null,
      active: true,
      lastGeneratedAt: iso(thisYear, thisMonth, 1),
      createdAt: iso(2026, 1, 1),
      updatedAt: iso(2026, 1, 1),
    },
    {
      id: 'rr-3',
      type: 'expense',
      amount: 13_500,
      categoryId: 'culture',
      title: '넷플릭스',
      memo: null,
      cycle: 'monthly',
      dayAnchor: 11,
      month: null,
      startsAt: iso(2026, 2, 11),
      endsAt: null,
      active: true,
      lastGeneratedAt: iso(thisYear, thisMonth, 11),
      createdAt: iso(2026, 2, 11),
      updatedAt: iso(2026, 2, 11),
    },
    {
      id: 'rr-4',
      type: 'income',
      amount: 2_850_000,
      categoryId: 'salary',
      title: '급여',
      memo: null,
      cycle: 'monthly',
      dayAnchor: 1,
      month: null,
      startsAt: iso(2026, 1, 1),
      endsAt: null,
      active: true,
      lastGeneratedAt: iso(thisYear, thisMonth, 1),
      createdAt: iso(2026, 1, 1),
      updatedAt: iso(2026, 1, 1),
    },
    {
      id: 'rr-5',
      type: 'expense',
      amount: 9_900,
      categoryId: 'culture',
      title: '유튜브 프리미엄',
      memo: null,
      cycle: 'monthly',
      dayAnchor: 18,
      month: null,
      startsAt: iso(2026, 4, 18),
      endsAt: null,
      active: false,
      lastGeneratedAt: iso(2026, 6, 18),
      createdAt: iso(2026, 4, 18),
      updatedAt: iso(2026, 6, 20),
    },
  ],
  budgets: [
    {
      id: 'bd-total',
      month: toMonthKey(now),
      categoryId: null,
      amount: 2_000_000,
      createdAt: iso(thisYear, thisMonth, 1),
      updatedAt: iso(thisYear, thisMonth, 1),
    },
    {
      id: 'bd-food',
      month: toMonthKey(now),
      categoryId: 'food',
      amount: 500_000,
      createdAt: iso(thisYear, thisMonth, 1),
      updatedAt: iso(thisYear, thisMonth, 1),
    },
    {
      id: 'bd-shopping',
      month: toMonthKey(now),
      categoryId: 'shopping',
      amount: 200_000,
      createdAt: iso(thisYear, thisMonth, 1),
      updatedAt: iso(thisYear, thisMonth, 1),
    },
    {
      id: 'bd-transport',
      month: toMonthKey(now),
      categoryId: 'transport',
      amount: 80_000,
      createdAt: iso(thisYear, thisMonth, 1),
      updatedAt: iso(thisYear, thisMonth, 1),
    },
  ],
  personalRules: [
    { id: 'pr-1', keyword: '김밥천국', categoryId: 'food', createdAt: iso(2026, 5, 2) },
    { id: 'pr-2', keyword: '무신사', categoryId: 'shopping', createdAt: iso(2026, 5, 9) },
  ],
  notifications: [
    {
      id: 'nt-1',
      kind: 'budget80',
      title: '식비 예산 80% 도달',
      body: '이번 달 식비 예산 50만원 중 41만원을 썼어요.',
      createdAt: iso(thisYear, thisMonth, Math.max(1, now.getDate() - 1), 18, 12),
      read: false,
    },
    {
      id: 'nt-2',
      kind: 'recurring',
      title: '고정지출이 기록됐어요',
      body: 'SKT 요금 59,000원이 자동으로 기록됐어요.',
      createdAt: iso(thisYear, thisMonth, Math.max(1, now.getDate() - 2), 9, 0),
      read: false,
    },
    {
      id: 'nt-3',
      kind: 'reminder',
      title: '오늘 지출 기록했나요?',
      body: '하루 1분, 한푼이면 충분해요.',
      createdAt: iso(thisYear, thisMonth, Math.max(1, now.getDate() - 3), 21, 0),
      read: true,
    },
  ],
};

export { nextId };
