import { Check } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscribeToast, type ToastMessage } from '../lib/toast';
import { useTheme } from '../theme/ThemeProvider';
import { iconStroke, layout } from '../theme/tokens';

/**
 * 들어올 때가 나갈 때보다 길다 — BottomSheet 와 같은 원칙.
 * 다만 토스트는 시트보다 훨씬 작은 물건이라 둘 다 더 짧다.
 */
const IN_MS = 180;
const OUT_MS = 150;

/** 머무는 시간. 안드로이드 Toast.SHORT(2초)보다 조금 길게 — 한글 한 줄을 읽을 시간 */
const VISIBLE_MS = 2200;

/**
 * 토스트 표시기. 앱에 하나만 마운트한다(App.tsx).
 *
 * 네비게이터 바깥에 두는 이유: 저장 직후 화면이 닫히면서 토스트를 띄우는 경우가 많아,
 * 화면 안에 두면 화면과 함께 사라진다.
 */
export function ToastHost() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    subscribeToast(setMessage);
    return () => subscribeToast(null);
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    // 앞 토스트가 아직 있으면 자리를 물려받는다 — 쌓지 않고 갈아 끼운다
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // stop() 으로 끊긴 경우(새 토스트가 들어옴)에는 지우면 안 된다
        if (finished) {
          setMessage(null);
        }
      });
    }, VISIBLE_MS);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      progress.stopAnimation();
    };
  }, [message, progress]);

  if (!message) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + layout.toastBottom,
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
      <Animated.View
        style={{
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
          maxWidth: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: tokens.toastBg,
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }}>
        <Check size={16} strokeWidth={iconStroke.default} color={tokens.toastInk} />
        <Text
          numberOfLines={2}
          style={{ flexShrink: 1, fontSize: 13.5, fontWeight: '600', color: tokens.toastInk }}>
          {message.text}
        </Text>
      </Animated.View>
    </View>
  );
}
