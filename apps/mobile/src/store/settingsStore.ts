import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface SettingsState {
  themeMode: ThemeMode;
  /** 매일 저녁 입력 리마인더 사용 여부 */
  reminderEnabled: boolean;
  /** 'HH:mm' — 기획 확정 기본값 21:00 */
  reminderTime: string;
  /** 예산 80% / 100% 도달 푸시 */
  budgetAlertEnabled: boolean;
  /** 앱 잠금 */
  appLockEnabled: boolean;
  /** 생체 인증(Face ID / 지문) 사용 */
  biometricEnabled: boolean;
  /** 온보딩 완료 여부 */
  onboarded: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setBudgetAlertEnabled: (enabled: boolean) => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setOnboarded: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      themeMode: 'system',
      reminderEnabled: true,
      reminderTime: '21:00',
      budgetAlertEnabled: true,
      appLockEnabled: false,
      biometricEnabled: false,
      onboarded: false,

      setThemeMode: themeMode => set({ themeMode }),
      setReminderEnabled: reminderEnabled => set({ reminderEnabled }),
      setReminderTime: reminderTime => set({ reminderTime }),
      setBudgetAlertEnabled: budgetAlertEnabled => set({ budgetAlertEnabled }),
      setAppLockEnabled: appLockEnabled => set({ appLockEnabled }),
      setBiometricEnabled: biometricEnabled => set({ biometricEnabled }),
      setOnboarded: onboarded => set({ onboarded }),
    }),
    {
      name: 'hanpun.settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
