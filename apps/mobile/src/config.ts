import { Platform } from 'react-native';

/**
 * 앱 실행 설정.
 *
 * USE_MOCK_API=true 인 동안 앱은 서버 없이 목 데이터로 완전히 동작한다.
 * 서버(M1)가 준비되면 이 값만 false 로 바꾸면 실제 API 를 호출한다.
 */
export const USE_MOCK_API = true;

/** 개발용 서버 주소 — Android 에뮬레이터는 10.0.2.2 로 호스트에 접근한다 */
const DEV_HOST = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const API_BASE_URL = __DEV__ ? `${DEV_HOST}/api/v1` : 'https://api.hanpun.app/api/v1';

/** 네트워크 타임아웃 (ms) */
export const API_TIMEOUT = 10_000;

/** TanStack Query 캐시 저장 키 */
export const QUERY_CACHE_KEY = 'hanpun.query-cache';

/** 캐시 보존 기간 — 오프라인 열람용 (7일) */
export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
