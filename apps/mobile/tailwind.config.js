/**
 * 한푼 디자인 토큰 — Claude Design 「컬러 토큰」 카드와 1:1 일치.
 * 다크 모드는 class 전략(nativewind colorScheme)으로 dark: 변형을 사용한다.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff4ee',
          100: '#ffe8db',
          200: '#ffd0b5',
          300: '#fbaa80',
          400: '#f28551',
          500: '#eb6834',
          600: '#c94e1f',
          700: '#a03c15',
          800: '#802e0e',
        },
        ink: {
          DEFAULT: '#1c1b1a',
          2: '#6f6d69',
          3: '#9a9891',
        },
        surface: '#ffffff',
        page: '#f7f6f3',
        line: '#ecebe7',
        good: '#0ca30c',
        critical: '#d03b3b',
        // 다크 테마 토큰
        'page-dark': '#111110',
        'surface-dark': '#1c1b1a',
        'surface-dark-2': '#26251f',
        'line-dark': '#2c2b29',
        'ink-dark': '#f4f3f0',
        'ink-dark-2': '#b0aea8',
        'ink-dark-3': '#7d7b75',
        'track-dark': '#2c2b29',
        track: '#f0efe9',
        // 비활성(disabled) 상태 — 버튼 카드
        disabled: '#e5e3de',
        'disabled-text': '#a5a39c',
        'disabled-dark': '#2c2b29',
        'disabled-text-dark': '#6b6963',
        // 아이콘 배경 틴트 (theme/tokens.ts 의 neutralTint·criticalTint·goodTint 와 동일)
        'neutral-tint': '#f2f1ec',
        'neutral-tint-dark': '#26251f',
        'critical-tint': '#fdeaea',
        'critical-tint-dark': '#361f21',
        'good-tint': '#e7f5ec',
        'good-tint-dark': '#1a2e23',
        // 세그먼트 토글 트랙
        segment: '#eeede9',
        'segment-dark': '#26251f',
      },
      fontSize: {
        // 타이포그래피 카드 스케일
        hero: ['34px', '40px'],
        title1: ['22px', '28px'],
        title2: ['17px', '23px'],
        body: ['15px', '21px'],
        caption: ['13px', '18px'],
        label: ['11px', '15px'],
      },
      borderRadius: {
        card: '16px',
        field: '14px',
        chip: '12px',
      },
    },
  },
  plugins: [],
};
