import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

/**
 * 열림·닫힘 시간.
 *
 * 열 때가 더 길다 — 들어오는 동작은 눈이 따라가야 하고, 나가는 동작은
 * 이미 결정된 일이라 빠를수록 반응이 좋게 느껴진다.
 */
const OPEN_MS = 260;
const CLOSE_MS = 190;

/** 시트가 화면 꼭대기까지 차오르지 않도록 남기는 최소 여백 */
const TOP_GAP = 28;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 내용이 길 때 스크롤 허용 */
  scrollable?: boolean;
}

/**
 * 공용 바텀시트.
 *
 * 예전에는 `Modal animationType="slide"` 하나로 끝냈다. 그러면 **어두운 배경까지
 * 시트와 함께 아래에서 밀려 올라온다.** 화면 절반이 위로 슬라이드하는 셈이라
 * 배경이 잘려 붙은 것처럼 보이고, 딤이 깔리는 느낌이 전혀 나지 않았다.
 *
 * 지금은 둘을 분리한다 — **배경은 그 자리에서 서서히 어두워지고(opacity), 시트만
 * 아래에서 올라온다(translateY).** 이게 iOS·머티리얼 양쪽의 표준 동작이다.
 *
 * 이동 거리는 시트의 **실제 높이**를 재서 쓴다. 화면 높이만큼 고정으로 밀면
 * 작은 시트일수록 필요 이상으로 긴 거리를 달려와 굼떠 보인다.
 */
export function BottomSheet({ visible, onClose, title, children, scrollable = false }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // visible 이 false 가 된 뒤에도 닫힘 애니메이션이 끝날 때까지 Modal 을 살려 둔다.
  // 바로 언마운트하면 시트가 사라지는 게 아니라 '증발' 한다.
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    opened.current = false;
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [visible, progress]);

  /**
   * 높이를 안 **다음에** 연다. 첫 레이아웃 전에는 progress 가 0 이라 화면 밖에 있으므로
   * 사용자에게는 어차피 보이지 않는다.
   * 내용이 바뀌어 다시 레이아웃돼도 다시 열지는 않는다(`opened`).
   */
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const { height } = event.nativeEvent.layout;
      setSheetHeight(height);
      if (opened.current) {
        return;
      }
      opened.current = true;
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [progress],
  );

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    // 아직 못 쟀으면 화면 높이만큼 — 어떤 시트든 확실히 화면 밖이다
    outputRange: [sheetHeight || windowHeight, 0],
  });

  const Body = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: progress }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={onClose}
            style={{ flex: 1, backgroundColor: tokens.overlay }}
          />
        </Animated.View>

        <Animated.View
          onLayout={handleLayout}
          style={{
            transform: [{ translateY }],
            // 내용이 길어도 화면을 넘지 않는다. scrollable 시트는 이 안에서 스크롤된다
            maxHeight: windowHeight - insets.top - TOP_GAP,
            backgroundColor: tokens.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 20 + insets.bottom,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: -10 },
            elevation: 24,
          }}>
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: tokens.controlTrack,
              alignSelf: 'center',
              marginTop: 4,
              marginBottom: 14,
            }}
          />
          {title ? (
            <Text className="mb-[6px] text-[16px] font-bold text-ink dark:text-ink-dark">
              {title}
            </Text>
          ) : null}
          {/* flexShrink 가 없으면 긴 내용이 maxHeight 를 뚫고 나간다 */}
          <Body style={{ flexShrink: 1 }}>{children}</Body>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** 중앙 다이얼로그 셸 (삭제 확인 등) — radius 20 / padding 24 20 16 */
export function CenterDialog({ visible, onClose, children }: DialogProps) {
  const { tokens } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 36,
        }}>
        <View
          style={{
            width: '100%',
            backgroundColor: tokens.surface,
            borderRadius: 20,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 50,
            shadowOffset: { width: 0, height: 20 },
            elevation: 24,
          }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}
