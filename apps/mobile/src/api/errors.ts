/**
 * API 에러 타입.
 *
 * client.ts 와 분리한 이유: 목 API 도 같은 에러 타입을 던져야 화면이 서버/목을 구분하지 않는데,
 * client.ts 를 import 하면 axios·authStore·AsyncStorage 까지 끌려온다.
 * 에러 타입만 필요한 쪽(목, 테스트)은 이 파일만 가져간다.
 */

/** 서버 표준 에러 응답 (NestJS exception filter 규격) */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/** 화면에서 그대로 보여줄 수 있는 사용자 문구를 가진 에러 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
