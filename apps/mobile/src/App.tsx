import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from './screens/AppLockScreen';
import { queryClient, queryPersister, resetQueryCache } from './lib/queryClient';
import { RootNavigator } from './navigation/RootNavigator';
import { QUERY_CACHE_MAX_AGE } from './config';
import { useAuthStore } from './store/authStore';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister, maxAge: QUERY_CACHE_MAX_AGE }}>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * 스플래시 종료 · StatusBar · 앱 잠금 게이트를 담당하는 셸.
 * 저장된 로그인 정보(zustand persist)가 복원된 뒤에 스플래시를 내린다.
 */
function AppShell() {
  const { isDark, tokens } = useTheme();
  const hydrated = useAuthStore(state => state.hydrated);
  const userId = useAuthStore(state => state.user?.id ?? null);
  const [splashHidden, setSplashHidden] = useState(false);
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (hydrated && !splashHidden) {
      BootSplash.hide({ fade: true }).catch(() => undefined);
      setSplashHidden(true);
    }
  }, [hydrated, splashHidden]);

  /**
   * 로그인 사용자가 바뀌면(로그아웃 · 회원탈퇴 · 401 · 계정 전환) 조회 캐시를 버린다.
   * 캐시는 AsyncStorage 에 7일간 남으므로 지우지 않으면 다음 사용자가 이전 사용자의
   * 금액과 내역을 보게 된다. 화면마다 처리하면 빠뜨리는 경로가 생기므로 여기서 한 번만 한다.
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous !== null && previous !== userId) {
      resetQueryCache().catch(() => undefined);
    }
  }, [hydrated, userId]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={tokens.page}
      />
      <AppLockGate>
        <RootNavigator />
      </AppLockGate>
    </>
  );
}
