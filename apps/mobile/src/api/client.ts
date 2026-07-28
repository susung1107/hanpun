import type { AuthTokens } from '@hanpun/shared';
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL, API_TIMEOUT } from '../config';
import { getAccessToken, useAuthStore } from '../store/authStore';
import { ApiError, type ApiErrorBody } from './errors';

/** 화면·훅이 계속 client 에서 가져올 수 있도록 재수출한다 */
export { ApiError, type ApiErrorBody } from './errors';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 리프레시 전용 인스턴스.
 * apiClient 로 갱신을 요청하면 그 요청이 401 을 받았을 때 인터셉터가 다시 갱신을 시도하며 무한 재귀한다.
 */
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

/** 진행 중인 갱신 (동시에 401 을 받은 요청들이 공유한다) */
let refreshTask: Promise<string | null> | null = null;

/**
 * 액세스 토큰을 갱신한다. 실패하면 null.
 *
 * 여러 요청이 동시에 401 을 받는 일은 흔하다(화면 진입 시 쿼리 3~4개가 같이 나간다).
 * 각자 갱신을 시도하면 서버가 리프레시 토큰을 회전시키는 순간 나머지 요청의 토큰이 무효가 되어
 * 멀쩡한 세션이 로그아웃된다. 그래서 갱신은 항상 하나만 돌리고 결과를 나눠 쓴다.
 */
function refreshAccessToken(): Promise<string | null> {
  if (refreshTask) {
    return refreshTask;
  }
  refreshTask = (async () => {
    try {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;
      if (!refreshToken) {
        return null;
      }
      const { data } = await refreshClient.post<AuthTokens>('/auth/refresh', { refreshToken });
      if (!data?.accessToken) {
        return null;
      }
      useAuthStore.getState().setTokens(data);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshTask = null;
    }
  })();
  return refreshTask;
}

/** 401 재시도를 한 번만 하기 위한 표시 */
interface RetriableConfig extends InternalAxiosRequestConfig {
  retriedAfterRefresh?: boolean;
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableConfig | undefined;

    // 액세스 토큰 30분 / 리프레시 30일 — 만료마다 로그아웃시키면 앱을 쓸 수 없다.
    // 갱신이 실패했을 때에만 세션을 버린다.
    if (error.response?.status === 401 && config && !config.retriedAfterRefresh) {
      config.retriedAfterRefresh = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient.request(config);
      }
      useAuthStore.getState().signOut();
    }

    return Promise.reject(toApiError(error));
  },
);

/** axios 에러를 사용자에게 보여줄 문구로 바꾼다 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return new ApiError('인터넷 연결을 확인해 주세요.', 0);
    }
    const body = error.response.data;
    const raw = Array.isArray(body?.message) ? body.message[0] : body?.message;
    return new ApiError(raw ?? '잠시 후 다시 시도해 주세요.', error.response.status);
  }
  return new ApiError('알 수 없는 오류가 발생했어요.', -1);
}
