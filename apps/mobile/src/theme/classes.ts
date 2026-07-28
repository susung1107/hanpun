/**
 * 반복되는 NativeWind 클래스 묶음.
 *
 * 다크 모드는 `dark:` 변형으로 처리하므로 색 클래스가 길어진다.
 * 화면 코드의 가독성을 위해 자주 쓰는 조합만 여기 모아 재사용한다.
 * (색 값 자체는 tailwind.config.js 가 단일 출처)
 */
export const cx = {
  /** 화면 배경 */
  page: 'flex-1 bg-page dark:bg-page-dark',
  /** 기본 카드 (radius 16 / 1px line border) */
  card: 'bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-card',
  /** 홈 요약 카드처럼 radius 18 */
  cardLg: 'bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-[18px]',
  /** 구분선 */
  divider: 'border-b border-line dark:border-line-dark',
  /** 텍스트 */
  ink: 'text-ink dark:text-ink-dark',
  ink2: 'text-ink-2 dark:text-ink-dark-2',
  ink3: 'text-ink-3 dark:text-ink-dark-3',
  accent: 'text-orange-600 dark:text-orange-400',
  /** 타이포 프리셋 */
  hero: 'text-hero font-bold text-ink dark:text-ink-dark',
  title1: 'text-title1 font-bold text-ink dark:text-ink-dark',
  title2: 'text-title2 font-semibold text-ink dark:text-ink-dark',
  body: 'text-body text-ink dark:text-ink-dark',
  amount: 'text-body font-semibold text-ink dark:text-ink-dark',
  caption: 'text-caption text-ink-2 dark:text-ink-dark-2',
  label: 'text-label font-medium text-ink-3 dark:text-ink-dark-3',
  /** 탭 화면 제목 (18px / 700) — 통계·캘린더·설정 헤더 */
  screenTitle: 'text-[18px] font-bold text-ink dark:text-ink-dark',
  /** 섹션 제목 (14px / 700) */
  sectionTitle: 'text-[14px] font-bold text-ink dark:text-ink-dark',
  /** 선택 상태 (카테고리 칩 주기 필) */
  selected: 'bg-orange-50 dark:bg-orange-500/15 border-orange-500',
  unselected: 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark',
} as const;
