import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

/** 화면 어디서나 타입이 붙은 루트 스택 네비게이션을 얻는다 */
export function useAppNavigation(): AppNavigation {
  return useNavigation<AppNavigation>();
}
