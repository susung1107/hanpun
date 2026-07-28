import type {
  CategoryId,
  ExpenseCategoryId,
  IncomeCategoryId,
  TransactionType,
} from './types';

/**
 * 카테고리 메타 정의 (디자인 시스템 category-chips 카드와 1:1 일치).
 *
 * - icon: lucide 아이콘 이름 (앱에서 lucide-react-native 컴포넌트로 매핑)
 * - tint: 아이콘칩 배경(파스텔), stroke: 아이콘 선 색
 * - 이 색은 "친근함"을 위한 보조 색이며 통계 차트에는 쓰지 않는다 (차트는 주황 단일색).
 */
export interface CategoryMeta {
  id: CategoryId;
  type: TransactionType;
  label: string;
  icon: string;
  tint: string;
  stroke: string;
  /** 다크 모드용 칩 배경 (파스텔을 낮은 명도로 치환) */
  tintDark: string;
  strokeDark: string;
}

export const EXPENSE_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'food', type: 'expense', label: '식비', icon: 'Utensils', tint: '#ffece3', stroke: '#d9652d', tintDark: '#3a271d', strokeDark: '#f0916a' },
  { id: 'transport', type: 'expense', label: '교통', icon: 'Bus', tint: '#e8f0fc', stroke: '#4a7fd6', tintDark: '#1e2a3c', strokeDark: '#7ea9e8' },
  { id: 'housing', type: 'expense', label: '주거', icon: 'House', tint: '#eceefa', stroke: '#5b68c8', tintDark: '#22243a', strokeDark: '#8f99e0' },
  { id: 'utility', type: 'expense', label: '공과금', icon: 'Lightbulb', tint: '#fdf2d7', stroke: '#c9930f', tintDark: '#332a12', strokeDark: '#e0b33f' },
  { id: 'telecom', type: 'expense', label: '통신', icon: 'Smartphone', tint: '#e7f4fb', stroke: '#3d95c2', tintDark: '#1a2b34', strokeDark: '#6fbadf' },
  { id: 'shopping', type: 'expense', label: '쇼핑', icon: 'ShoppingBag', tint: '#fdeaf2', stroke: '#cf5590', tintDark: '#361f2b', strokeDark: '#e88bb5' },
  { id: 'health', type: 'expense', label: '의료/건강', icon: 'HeartPulse', tint: '#e7f5ec', stroke: '#35a06b', tintDark: '#1a2e23', strokeDark: '#63c294' },
  { id: 'culture', type: 'expense', label: '문화/여가', icon: 'Clapperboard', tint: '#f1ecfc', stroke: '#8155d4', tintDark: '#28213a', strokeDark: '#a98ae6' },
  { id: 'event', type: 'expense', label: '경조사', icon: 'Gift', tint: '#fdeaea', stroke: '#d04f5c', tintDark: '#361f21', strokeDark: '#e5848d' },
  { id: 'etc', type: 'expense', label: '기타', icon: 'Ellipsis', tint: '#efeeea', stroke: '#85837a', tintDark: '#2a2926', strokeDark: '#adaba2' },
] as const;

export const INCOME_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'salary', type: 'income', label: '급여', icon: 'Briefcase', tint: '#f7ede2', stroke: '#b07443', tintDark: '#332720', strokeDark: '#d19c6e' },
  { id: 'sideIncome', type: 'income', label: '부수입', icon: 'HandCoins', tint: '#e8f0fc', stroke: '#4a7fd6', tintDark: '#1e2a3c', strokeDark: '#7ea9e8' },
  { id: 'allowance', type: 'income', label: '용돈', icon: 'PiggyBank', tint: '#fdeaf2', stroke: '#cf5590', tintDark: '#361f2b', strokeDark: '#e88bb5' },
  { id: 'financeIncome', type: 'income', label: '금융수입', icon: 'ChartLine', tint: '#e7f5ec', stroke: '#35a06b', tintDark: '#1a2e23', strokeDark: '#63c294' },
  { id: 'incomeEtc', type: 'income', label: '기타', icon: 'Coins', tint: '#efeeea', stroke: '#85837a', tintDark: '#2a2926', strokeDark: '#adaba2' },
] as const;

export const ALL_CATEGORIES: readonly CategoryMeta[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

const CATEGORY_MAP: Record<string, CategoryMeta> = ALL_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<string, CategoryMeta>,
);

/** 카테고리 메타를 안전하게 조회한다 (미지의 id 는 '기타'로 폴백) */
export function getCategory(id: CategoryId | string): CategoryMeta {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP.etc!;
}

/** 카테고리 라벨만 필요할 때 */
export function getCategoryLabel(id: CategoryId | string): string {
  return getCategory(id).label;
}

/** 거래 종류에 맞는 카테고리 목록 */
export function getCategoriesByType(type: TransactionType): readonly CategoryMeta[] {
  return type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export const EXPENSE_CATEGORY_IDS: readonly ExpenseCategoryId[] = EXPENSE_CATEGORIES.map(
  c => c.id as ExpenseCategoryId,
);

export const INCOME_CATEGORY_IDS: readonly IncomeCategoryId[] = INCOME_CATEGORIES.map(
  c => c.id as IncomeCategoryId,
);
