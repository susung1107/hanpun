import { ScanFace } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus, Pressable, Text, View } from 'react-native';

import { LogoBadge } from '../components';
import { usePressed } from '../hooks/usePressed';
import { authenticate, describeBiometry, getBiometryKind, type BiometryKind } from '../lib/biometrics';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/ThemeProvider';

/**
 * 잠금을 풀 수 없을 때의 유일한 탈출구.
 * 기획 v1.2 의 잠금 수단은 생체 인증뿐이므로, 기기에서 생체 인증이 사라지면
 * (지문 삭제 · 기기 변경) 앱에 영원히 들어올 수 없게 된다. 그래서 잠금 설정을 끄고
 * 로그아웃시켜 로그인 화면으로 되돌린다. 기록은 서버에 있으므로 데이터는 잃지 않는다.
 */
function confirmRecovery(): void {
  Alert.alert(
    '잠금을 해제할 수 없나요?',
    '로그아웃하면 잠금이 풀립니다. 다시 로그인해야 하지만 기록은 서버에 그대로 남아 있어요.',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          useSettingsStore.getState().setAppLockEnabled(false);
          useAuthStore.getState().signOut();
        },
      },
    ],
  );
}

/**
 * 앱 잠금 화면 (디자인 app-lock).
 * 앱 아이콘 72 + 안내 문구 + 88px 원형 생체 인증 버튼 + 복구 링크
 */
export function AppLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { tokens } = useTheme();
  const { pressed, pressHandlers } = usePressed();
  const [kind, setKind] = useState<BiometryKind>('none');
  const [failed, setFailed] = useState(false);

  const run = useCallback(async () => {
    const ok = await authenticate('한푼 잠금 해제');
    if (ok) {
      setFailed(false);
      onUnlock();
    } else {
      setFailed(true);
    }
  }, [onUnlock]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const detected = await getBiometryKind();
      if (cancelled) {
        return;
      }
      setKind(detected);
      if (detected !== 'none') {
        await run();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [run]);

  const label = describeBiometry(kind);
  const unavailable = kind === 'none';

  return (
    <View className="flex-1 items-center justify-center bg-page px-[40px] dark:bg-page-dark">
      <LogoBadge size={72} radius={22} />

      <Text className="mt-[22px] text-[19px] font-bold text-ink dark:text-ink-dark">잠금 해제</Text>
      <Text
        className="mt-[6px] text-center text-[13.5px] text-ink-2 dark:text-ink-dark-2"
        style={{ lineHeight: 22 }}>
        {unavailable
          ? '이 기기에서 생체 인증을 쓸 수 없어요'
          : failed
            ? '인증이 취소됐어요 · 다시 시도해 주세요'
            : '한푼은 잠금으로 보호되고 있어요'}
      </Text>

      {!unavailable && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}로 잠금 해제`}
            onPress={run}
            {...pressHandlers}
            style={{
              marginTop: 36,
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tokens.surface,
              borderWidth: 1.5,
              borderColor: tokens.line,
              opacity: pressed ? 0.7 : 1,
            }}>
            <ScanFace size={40} strokeWidth={1.6} color={tokens.accentText} />
          </Pressable>
          <Text className="mt-[14px] text-[13px] font-semibold text-orange-600 dark:text-orange-400">
            {`${label}로 잠금 해제`}
          </Text>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={confirmRecovery}
        hitSlop={8}
        className={unavailable ? 'mt-[30px]' : 'mt-[26px]'}>
        <Text className="text-[12.5px] text-ink-3 dark:text-ink-dark-3">
          로그아웃하고 잠금 해제
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * 앱 잠금 게이트.
 * 설정에서 잠금을 켜면 앱 시작·백그라운드 복귀 시 잠금 화면을 먼저 띄운다.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const appLockEnabled = useSettingsStore(state => state.appLockEnabled);
  const [locked, setLocked] = useState(appLockEnabled);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    setLocked(appLockEnabled);
  }, [appLockEnabled]);

  useEffect(() => {
    if (!appLockEnabled) {
      return;
    }
    const handler = (state: AppStateStatus) => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (state === 'active' && backgroundedAt.current) {
        // 잠깐 전환(사진 선택 등)에는 다시 묻지 않는다 — 10초 이상 떠나면 잠금
        if (Date.now() - backgroundedAt.current > 10_000) {
          setLocked(true);
        }
        backgroundedAt.current = null;
      }
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, [appLockEnabled]);

  if (appLockEnabled && locked) {
    return <AppLockScreen onUnlock={() => setLocked(false)} />;
  }
  return <>{children}</>;
}
