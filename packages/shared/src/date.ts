/**
 * 날짜 유틸 (앱/서버 공통).
 *
 * 저장·전송은 UTC ISO8601, 표시는 로컬. 여기서는 표시용 문자열과
 * 'YYYY-MM' / 'YYYY-MM-DD' 키 생성을 담당한다.
 */

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Date → 'YYYY-MM-DD' (로컬 기준) */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Date → 'YYYY-MM' (로컬 기준) */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/** 'YYYY-MM' → Date (해당 월 1일 로컬 0시) */
export function fromMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1);
}

/** 'YYYY-MM' → "7월" */
export function formatMonthShort(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number);
  return `${month}월`;
}

/** 'YYYY-MM' → "2026년 7월" */
export function formatMonthLong(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}년 ${month}월`;
}

/** ISO → "2026. 7. 22 (수)" */
export function formatDateWithWeekday(iso: string): string {
  const date = new Date(iso);
  const weekday = WEEKDAY_KO[date.getDay()];
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()} (${weekday})`;
}

/** ISO → "7월 22일 (수)" */
export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_KO[date.getDay()]})`;
}

/** ISO → "오후 2:30" */
export function formatTimeKo(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const meridiem = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${meridiem} ${hour12}:${pad2(date.getMinutes())}`;
}

/** 오늘/어제면 그 단어를, 아니면 짧은 날짜를 반환 */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const todayKey = toDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetKey = toDateKey(target);
  if (targetKey === todayKey) {
    return '오늘';
  }
  if (targetKey === toDateKey(yesterday)) {
    return '어제';
  }
  return formatDateShort(iso);
}

/** 해당 월의 일수 */
export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** 월 이동: 'YYYY-MM' 에서 offset 개월 만큼 */
export function shiftMonth(monthKey: string, offset: number): string {
  const base = fromMonthKey(monthKey);
  base.setMonth(base.getMonth() + offset);
  return toMonthKey(base);
}

/**
 * 캘린더 그리드용 6주(42칸) 날짜 배열. 일요일 시작.
 * 이번 달이 아닌 앞뒤 날짜도 포함하며 inCurrentMonth 로 구분한다.
 */
export interface CalendarCell {
  date: Date;
  /** 'YYYY-MM-DD' */
  dateKey: string;
  /** 1~31 */
  day: number;
  inCurrentMonth: boolean;
}

export function buildCalendarGrid(monthKey: string): CalendarCell[] {
  const first = fromMonthKey(monthKey);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: toDateKey(date),
      day: date.getDate(),
      inCurrentMonth: toMonthKey(date) === monthKey,
    };
  });
}

export { WEEKDAY_KO };
