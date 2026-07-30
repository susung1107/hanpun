/** 고를 수 있는 가장 이른 해. 이보다 과거로는 페이지를 넘기지 않는다. */
export const MIN_YEAR = 2000;

/** 한 페이지에 보여 주는 해의 개수 (4열 × 3줄) */
export const YEARS_PER_PAGE = 12;

/**
 * `year` 가 들어 있는 12년 묶음의 첫 해를 구한다.
 *
 * 묶음은 **오늘(maxYear)에서 거꾸로** 끊는다. 그래야 첫 화면이 항상 `… ~ 올해` 로 끝나고,
 * 아직 오지 않은 해가 격자에 아예 나타나지 않는다. 2000년·2012년 같은 절대 기준으로
 * 끊으면 올해가 줄 한가운데 박히고 같은 줄에 미래가 함께 보여, 비활성 칸을 따로
 * 만들어야 한다.
 */
export function yearPageStart(year: number, maxYear: number): number {
  const clamped = Math.min(Math.max(year, MIN_YEAR), maxYear);
  const page = Math.floor((maxYear - clamped) / YEARS_PER_PAGE);
  return maxYear - YEARS_PER_PAGE + 1 - page * YEARS_PER_PAGE;
}
