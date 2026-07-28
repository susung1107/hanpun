import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens, User } from '@hanpun/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  /** persist 복원 완료 여부 — 스플래시 종료 판단에 사용 */
  hydrated: boolean;

  signIn: (payload: { user: User; tokens: AuthTokens }) => void;
  signOut: () => void;
  setTokens: (tokens: AuthTokens) => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      tokens: null,
      hydrated: false,

      signIn: ({ user, tokens }) => set({ user, tokens }),
      signOut: () => set({ user: null, tokens: null }),
      setTokens: tokens => set({ tokens }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'hanpun.auth',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: state => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => state => {
        state?.markHydrated();
      },
    },
  ),
);

/** axios 인터셉터처럼 React 밖에서 토큰을 읽어야 할 때 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().tokens?.accessToken ?? null;
}
