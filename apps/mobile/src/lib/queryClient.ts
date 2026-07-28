import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { QUERY_CACHE_KEY, QUERY_CACHE_MAX_AGE } from '../config';

/**
 * 뮤테이션 메타 규격.
 * silent: true 를 주면 전역 알림을 띄우지 않는다 (화면에서 직접 에러를 그릴 때).
 */
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      silent?: boolean;
    };
  }
}

/**
 * 쓰기 실패는 반드시 사용자에게 보인다.
 * 화면마다 catch 를 붙이면 빠뜨리는 곳이 생기므로 전역 MutationCache 에서 한 번만 처리한다.
 * (401 은 api/client 에서 세션을 정리하며 로그인 화면으로 빠지므로 중복 알림을 띄우지 않는다)
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.silent) {
      return;
    }
    const status = (error as { status?: number }).status;
    if (status === 401) {
      return;
    }
    const message = error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.';
    Alert.alert('저장하지 못했어요', message);
  },
});

/**
 * 조회 데이터 캐시 정책 (개발계획서 v2.1 "온라인 기반 + 캐시 열람").
 * - staleTime 1분: 화면 재진입 때 즉시 캐시를 보여주고 뒤에서 갱신
 * - gcTime 7일: 오프라인에서도 마지막 내역·통계를 읽을 수 있게 유지
 * - 입력·수정·삭제(mutation)는 온라인 전용이므로 재시도하지 않는다
 */
export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: QUERY_CACHE_MAX_AGE,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** AsyncStorage 로 캐시를 디스크에 저장 → 앱 재시작·오프라인에서도 열람 가능 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
});

/**
 * 로그아웃·회원탈퇴 시 캐시를 완전히 비운다.
 * 캐시는 7일간 디스크에 남으므로 지우지 않으면 다음 로그인 사용자가 이전 사용자의
 * 금액·내역을 그대로 보게 된다. 메모리(clear)와 디스크(removeClient) 둘 다 지워야 한다.
 */
export async function resetQueryCache(): Promise<void> {
  queryClient.clear();
  await queryPersister.removeClient();
}
