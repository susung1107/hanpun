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
  AddTransaction:
    | {
        type?: TransactionType;
        categoryId?: CategoryId;
        date?: string;
        /** 반복거래를 만들러 들어온 경우 (반복거래 목록의 '추가') */
        mode?: 'once' | 'recurring';
      }
    | undefined;
  TransactionEdit: { id: string };
  Recurring: undefined;
  /** 반복거래 **수정** 전용. 새로 만들 때는 AddTransaction 의 '반복' 탭으로 간다. */
  AddRecurring: { id: string };
  Budget: undefined;
  Search: undefined;
  Notifications: undefined;
  Account: undefined;
};
