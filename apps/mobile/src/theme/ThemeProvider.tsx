import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';

import { useSettingsStore, type ThemeMode } from '../store/settingsStore';
import { darkTokens, lightTokens, type ThemeTokens } from './tokens';

interface ThemeContextValue {
  /** 실제 적용 중인 스킴 */
  scheme: 'light' | 'dark';
  /** 사용자가 고른 모드 (system 포함) */
  mode: ThemeMode;
  isDark: boolean;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  mode: 'system',
  isDark: false,
  tokens: lightTokens,
});

/**
 * 테마 결정 순서: 사용자가 고른 모드(light/dark) > 시스템 설정.
 * NativeWind 의 colorScheme 도 함께 맞춰 dark: 변형이 동작하게 한다.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const mode = useSettingsStore(state => state.themeMode);

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    nativewindColorScheme.set(mode === 'system' ? 'system' : mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      mode,
      isDark: scheme === 'dark',
      tokens: scheme === 'dark' ? darkTokens : lightTokens,
    }),
    [scheme, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** 색 값이 필요한 곳(차트·아이콘·StatusBar)에서 사용 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
