/**
 * 한푼 — 앱과 서버가 함께 쓰는 도메인 타입.
 *
 * 규칙 (개발계획서 v2.1):
 * - 금액은 항상 "원 단위 정수". 소수점·문자열 금액 금지.
 * - 시간은 항상 UTC ISO8601 문자열로 주고받는다. 표시 시점에만 로컬로 변환.
 * - 서버가 단일 진실(single source of truth). 앱은 조회 캐시만 보관한다.
 */

/** 거래 종류 */
export type TransactionType = 'expense' | 'income';

/** 지출 카테고리 (기획 v1.2 확정 — 사용자 추가 불가) */
export type ExpenseCategoryId =
  | 'food'
  | 'transport'
  | 'housing'
  | 'utility'
  | 'telecom'
  | 'shopping'
  | 'health'
  | 'culture'
  | 'event'
  | 'etc';

/** 수입 카테고리 (기획 v1.2 확정 — 사용자 추가 불가) */
export type IncomeCategoryId =
  | 'salary'
  | 'sideIncome'
  | 'allowance'
  | 'financeIncome'
  | 'incomeEtc';

export type CategoryId = ExpenseCategoryId | IncomeCategoryId;

/** 거래 1건 */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** 원 단위 정수 (항상 양수. 지출/수입 구분은 type 이 담당) */
  amount: number;
  categoryId: CategoryId;
  /** 내역 (상호명 등) */
  title: string;
  memo?: string | null;
  /** 거래 발생 시각 — UTC ISO8601 */
  occurredAt: string;
  /** 반복 규칙에서 자동 생성된 거래면 해당 규칙 id */
  recurringRuleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 거래 생성/수정 입력 */
export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  title: string;
  memo?: string | null;
  occurredAt: string;
}

/** 반복 주기 */
export type RecurringCycle = 'weekly' | 'monthly' | 'yearly';

/** 고정지출(반복) 규칙 */
export interface RecurringRule {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  title: string;
  memo?: string | null;
  cycle: RecurringCycle;
  /**
   * 결제일 기준값.
   * - weekly: 0(일)~6(토) — JavaScript `Date.getDay()` 와 같은 기준. 서버도 이 값을 그대로 쓴다.
   * - monthly: 1~31 (말일 처리는 서버가 담당 — 31일 규칙은 2월에 28/29일로 보정)
   * - yearly: 1~366 은 쓰지 않고 month + dayAnchor 조합을 사용
   */
  dayAnchor: number;
  /** yearly 일 때만 사용 (1~12) */
  month?: number | null;
  /** 규칙 시작일 — UTC ISO8601 */
  startsAt: string;
  /** 규칙 종료일 (없으면 무기한) */
  endsAt?: string | null;
  active: boolean;
  /** 서버 스케줄러가 마지막으로 거래를 생성한 시각 */
  lastGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRuleInput {
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  title: string;
  memo?: string | null;
  cycle: RecurringCycle;
  dayAnchor: number;
  month?: number | null;
  startsAt: string;
  endsAt?: string | null;
}

/** 예산 — 월 전체 예산은 categoryId 가 null */
export interface Budget {
  id: string;
  /** 'YYYY-MM' */
  month: string;
  categoryId: ExpenseCategoryId | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  month: string;
  categoryId: ExpenseCategoryId | null;
  amount: number;
}

/** 예산 진행 상황 (서버 집계) */
export interface BudgetProgress {
  categoryId: ExpenseCategoryId | null;
  budgetAmount: number;
  spentAmount: number;
  /** 0~n. 1 = 100% */
  ratio: number;
}

/** 월 통계 (GET /stats/monthly?month=YYYY-MM) */
export interface MonthlyStats {
  month: string;
  totalExpense: number;
  totalIncome: number;
  /** 전월 지출 (증감 표시용) */
  prevMonthExpense: number;
  byCategory: CategoryStat[];
  /** 일자별 지출 합계 — 캘린더·막대 그래프용 */
  byDay: DayStat[];
}

export interface CategoryStat {
  categoryId: CategoryId;
  amount: number;
  /** 0~1 */
  ratio: number;
  count: number;
}

/**
 * 일별 집계.
 * 해당 월의 **모든 날짜가 빠짐없이** 1일부터 말일까지 순서대로 들어온다.
 * 거래가 없는 날도 0 으로 채운다 — 차트의 x축이 실제 날짜와 어긋나지 않게 하려면 필수다.
 */
export interface DayStat {
  /** 'YYYY-MM-DD' (로컬 기준일. 서버가 사용자 타임존으로 집계) */
  date: string;
  expense: number;
  income: number;
}

/** 연 통계 (GET /stats/yearly?year=YYYY) */
export interface YearlyStats {
  year: number;
  totalExpense: number;
  totalIncome: number;
  byMonth: { month: string; expense: number; income: number }[];
  byCategory: CategoryStat[];
}

/** 개인 자동분류 규칙 */
export interface PersonalRule {
  id: string;
  /** 상호명 키워드 */
  keyword: string;
  categoryId: CategoryId;
  createdAt: string;
}

/** 자동분류 추천 결과 */
export interface ClassificationSuggestion {
  categoryId: CategoryId;
  /** 어디서 나온 추천인지 */
  source: 'personal' | 'dictionary' | 'fallback';
  matchedKeyword?: string;
}

/** 사용자 */
export interface User {
  id: string;
  email: string;
  nickname: string;
  provider: 'kakao' | 'google' | 'apple' | 'dev';
  createdAt: string;
}

/** 인증 토큰 쌍 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** 앱 알림 목록 항목 (로컬 저장) */
export interface AppNotification {
  id: string;
  kind: 'reminder' | 'budget80' | 'budget100' | 'recurring' | 'notice';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/** 목록 API 공통 응답 */
export interface Paginated<T> {
  items: T[];
  nextCursor?: string | null;
}
