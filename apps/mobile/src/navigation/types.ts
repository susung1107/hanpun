import type { CategoryId, TransactionType } from '@hanpun/shared';
import type { NavigatorScreenParams } from '@react-navigation/native';

/** 하단 탭 (홈 / 캘린더 / 통계 / 설정) */
export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Stats: undefined;
  Settings: undefined;
};

/** 루트 스택 */
export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  /** 월 전체 내역 */
  Transactions: { month?: string } | undefined;
  TransactionDetail: { id: string };
  /** 거래 입력 — type/categoryId 는 초기값 */
  AddTransaction: { type?: TransactionType; categoryId?: CategoryId; date?: string } | undefined;
  TransactionEdit: { id: string };
  Recurring: undefined;
  AddRecurring: { id?: string } | undefined;
  Budget: undefined;
  Search: undefined;
  Notifications: undefined;
  Account: undefined;
};
