import type { AuthTokens, User } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export interface SignInResponse extends AuthTokens {
  user: User;
}

/** 개발용 로그인 스텁 — 소셜 정식 연동은 M5 */
export async function devSignIn(provider: 'kakao' | 'google' | 'apple'): Promise<SignInResponse> {
  if (USE_MOCK_API) {
    const result = await mockApi.devSignIn();
    return {
      user: { ...result.user, provider },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
  const { data } = await apiClient.post<SignInResponse>('/auth/dev-login', { provider });
  return data;
}

export async function fetchMe(): Promise<User> {
  if (USE_MOCK_API) {
    return mockApi.getMe();
  }
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

/** 회원 탈퇴 — 서버에서 CASCADE 전량 삭제 */
export async function deleteAccount(): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.deleteAccount();
  }
  await apiClient.delete('/users/me');
}
