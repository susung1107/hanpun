/**
 * 디자인 토큰 (JS 값).
 *
 * NativeWind 클래스로 표현할 수 없는 곳 — SVG 차트, lucide 아이콘 color,
 * StatusBar, 네비게이션 테마 등 — 에서 사용한다.
 * tailwind.config.js 의 색과 반드시 동일한 값을 유지할 것.
 */

export const palette = {
  orange50: '#fff4ee',
  orange100: '#ffe8db',
  orange200: '#ffd0b5',
  orange300: '#fbaa80',
  orange400: '#f28551',
  orange500: '#eb6834',
  orange600: '#c94e1f',
  orange700: '#a03c15',

  ink: '#1c1b1a',
  ink2: '#6f6d69',
  ink3: '#9a9891',

  surface: '#ffffff',
  page: '#f7f6f3',
  line: '#ecebe7',
  track: '#f0efe9',

  good: '#0ca30c',
  critical: '#d03b3b',

  disabled: '#e5e3de',
  disabledText: '#a5a39c',

  /**
   * 네이티브 컨트롤 전용 회색 (Switch 꺼짐 트랙, 바텀시트 핸들).
   * NativeWind 로 지정할 수 없는 prop 에만 쓰므로 tailwind.config.js 에는 없다.
   */
  controlTrack: '#dcdad4',
  controlTrackDark: '#3a3936',

  pageDark: '#111110',
  surfaceDark: '#1c1b1a',
  surfaceDark2: '#26251f',
  lineDark: '#2c2b29',
  inkDark: '#f4f3f0',
  inkDark2: '#b0aea8',
  inkDark3: '#7d7b75',
  trackDark: '#2c2b29',
  orangeAccentDark: '#f28551',
  orangeChartDark: '#d95926',
  /** 다크 모드에서 orange-100 테두리를 대체하는 색 (디자인 home-dark) */
  orangeBorderDark: '#3a2c24',
} as const;

/** 테마별 의미 토큰 */
export interface ThemeTokens {
  page: string;
  surface: string;
  surfaceRaised: string;
  line: string;
  track: string;
  ink: string;
  ink2: string;
  ink3: string;
  /** 프라이머리(버튼·FAB) — 라이트/다크 공통 */
  primary: string;
  primaryPressed: string;
  /** 강조 텍스트 */
  accentText: string;
  /** 선택 상태 배경 */
  selectedBg: string;
  selectedBorder: string;
  /** 통계 차트 마크 (주황 단일색) */
  chart: string;
  chartMuted: string;
  good: string;
  critical: string;
  /** 아이콘 기본 stroke */
  icon: string;
  /** 네이티브 컨트롤 회색 (Switch 꺼짐 트랙 · 바텀시트 핸들) */
  controlTrack: string;
  /** 오버레이(모달 딤) */
  overlay: string;
  /** 중립 아이콘칩 배경(회색) — 상세 행·설정 시트 등 */
  neutralTint: string;
  /** 파괴적(critical) 아이콘 배경 틴트 — 삭제 다이얼로그 등 */
  criticalTint: string;
  /** 강조(주황) 아이콘 배경 틴트 — 빈 상태·프로필 배지 */
  accentTint: string;
  /** 차트 빈 막대(값 0) 색 */
  chartEmpty: string;
  /** AI 자동분류·안내 배너 배경/테두리 */
  bannerBg: string;
  bannerBorder: string;
}

export const lightTokens: ThemeTokens = {
  page: palette.page,
  surface: palette.surface,
  surfaceRaised: palette.surface,
  line: palette.line,
  track: palette.track,
  ink: palette.ink,
  ink2: palette.ink2,
  ink3: palette.ink3,
  primary: palette.orange500,
  primaryPressed: palette.orange600,
  accentText: palette.orange600,
  selectedBg: palette.orange50,
  selectedBorder: palette.orange500,
  chart: palette.orange500,
  chartMuted: palette.orange100,
  good: palette.good,
  critical: palette.critical,
  icon: palette.ink2,
  controlTrack: palette.controlTrack,
  overlay: 'rgba(28,27,26,0.45)',
  neutralTint: '#f2f1ec',
  criticalTint: '#fdeaea',
  accentTint: palette.orange50,
  chartEmpty: '#e5e3dd',
  bannerBg: palette.orange50,
  bannerBorder: palette.orange100,
};

export const darkTokens: ThemeTokens = {
  page: palette.pageDark,
  surface: palette.surfaceDark,
  surfaceRaised: palette.surfaceDark2,
  line: palette.lineDark,
  track: palette.trackDark,
  ink: palette.inkDark,
  ink2: palette.inkDark2,
  ink3: palette.inkDark3,
  primary: palette.orange500,
  primaryPressed: palette.orange600,
  accentText: palette.orangeAccentDark,
  selectedBg: 'rgba(235,104,52,0.14)',
  selectedBorder: palette.orange500,
  chart: palette.orangeChartDark,
  chartMuted: 'rgba(217,89,38,0.28)',
  good: '#3fbf4a',
  critical: '#e2635f',
  icon: palette.inkDark2,
  controlTrack: palette.controlTrackDark,
  overlay: 'rgba(0,0,0,0.6)',
  neutralTint: palette.surfaceDark2,
  criticalTint: '#361f21',
  accentTint: '#2b211c',
  chartEmpty: palette.lineDark,
  bannerBg: 'rgba(235,104,52,0.10)',
  bannerBorder: 'rgba(235,104,52,0.24)',
};

/** 아이콘 규격 (디자인 시스템 「아이콘」 카드) */
export const iconSize = {
  tab: 21,
  inline: 16,
  row: 19,
  chip: 17,
  header: 17,
  fab: 26,
} as const;

export const iconStroke = {
  default: 1.8,
  category: 1.9,
  fab: 2.2,
} as const;

/** 레이아웃 상수 */
export const layout = {
  screenPaddingX: 18,
  headerPaddingX: 22,
  cardRadius: 18,
  tabBarHeight: 78,
  fabSize: 58,
  // FAB 위치는 화면마다 같아야 한다 — 홈·캘린더·통계 어디서든 같은 자리에 떠야
  // 손이 그 위치를 기억한다. 그래서 오프셋을 여기 한 곳에만 둔다.
  fabBottom: 20,
  fabRight: 20,
} as const;
