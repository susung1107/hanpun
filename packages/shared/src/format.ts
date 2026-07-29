/**
 * 금액·숫자 포맷 (앱/서버 공통).
 * 금액은 원 단위 정수라는 전제 하에 동작한다.
 */

const NUMBER_FORMAT = new Intl.NumberFormat('ko-KR');

/** 1284500 → "1,284,500" */
export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(Math.trunc(value));
}

/** 4500 → "4,500원" */
export function formatAmountKo(value: number): string {
  return `${formatNumber(value)}원`;
}

/**
 * 리스트 행 금액. 지출은 마이너스 부호를 붙인다.
 * (4500, 'expense') → "-4,500원" · (2400000, 'income') → "+2,400,000원"
 */
export function formatSignedAmount(value: number, type: 'expense' | 'income'): string {
  const sign = type === 'expense' ? '-' : '+';
  return `${sign}${formatNumber(Math.abs(value))}원`;
}

/**
 * 폭이 좁은 곳의 금액 축약. 앱 전체가 이 함수 하나만 쓴다
 * (화면마다 따로 축약 규칙을 만들면 같은 금액이 화면마다 다르게 보인다).
 *
 * 4500 → "4,500원" · 1284500 → "128만원" · 320000000 → "3.2억원"
 *
 * - `unit: false` — '원' 을 뺀다. 캘린더 칸처럼 한 글자가 아까운 곳.
 * - `exactBelow` — 이 값 미만은 축약하지 않고 정확히 보여준다 (기본 1만).
 */
export function formatCompactWon(
  value: number,
  options: { unit?: boolean; exactBelow?: number } = {},
): string {
  const { unit = true, exactBelow = 10_000 } = options;
  const abs = Math.abs(Math.trunc(value));
  const suffix = unit ? '원' : '';

  if (abs < exactBelow) {
    return `${formatNumber(abs)}${suffix}`;
  }
  if (abs >= 100_000_000) {
    return `${trimZero(abs / 100_000_000)}억${suffix}`;
  }
  if (abs >= 10_000) {
    return `${trimZero(abs / 10_000)}만${suffix}`;
  }
  return `${formatNumber(abs)}${suffix}`;
}

/**
 * 예산처럼 값이 정확해야 하는 곳 — 만 단위로 딱 떨어질 때만 축약한다.
 * 2000000 → "200만원" · 2004500 → "2,004,500원"
 */
export function formatBudgetWon(value: number): string {
  const abs = Math.abs(Math.trunc(value));
  if (abs >= 10_000 && abs % 10_000 === 0) {
    return `${formatNumber(abs / 10_000)}만원`;
  }
  return `${formatNumber(abs)}원`;
}

/** 100만 이상은 소수점이 잡음이 되므로 버린다 (128.45만 → "128만") */
function trimZero(value: number): string {
  if (value >= 100) {
    return String(Math.round(value));
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** 0.64 → "64%" */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 입력창의 "12,500" 같은 문자열에서 정수만 추출 */
export function parseAmountInput(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) {
    return 0;
  }
  return Number.parseInt(digits, 10);
}

/** 전월 대비 증감 문구 — 절약이면 good, 증가면 warn */
export function describeMonthOverMonth(
  current: number,
  previous: number,
): { text: string; tone: 'good' | 'warn' | 'neutral' } {
  if (previous <= 0) {
    return { text: '전월 데이터 없음', tone: 'neutral' };
  }
  const diffRatio = (current - previous) / previous;
  const percent = Math.abs(Math.round(diffRatio * 100));
  if (percent === 0) {
    return { text: '전월과 동일', tone: 'neutral' };
  }
  return diffRatio < 0
    ? { text: `↓ 전월 대비 ${percent}% 절약`, tone: 'good' }
    : { text: `↑ 전월 대비 ${percent}% 증가`, tone: 'warn' };
}
