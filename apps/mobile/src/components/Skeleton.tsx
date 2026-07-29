import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

/**
 * 스켈레톤 — 데이터를 기다리는 동안 "들어올 내용의 모양"을 미리 그린다.
 *
 * 스피너 대신 스켈레톤을 쓰는 이유: 스피너는 화면이 통째로 비어 있다가 한 번에
 * 튀어나오지만, 스켈레톤은 최종 레이아웃과 같은 자리를 잡고 있어 데이터가 도착해도
 * 화면이 흔들리지 않는다. 체감 대기 시간도 짧다.
 *
 * 애니메이션은 react-native 내장 Animated 를 쓴다. 투명도만 바꾸므로
 * useNativeDriver 로 네이티브 스레드에서 돌아 JS 가 바빠도 끊기지 않는다.
 * (Reanimated 를 끌어올 만큼 복잡한 동작이 아니다)
 */

/**
 * 펄스 구동기는 **앱 전체에서 하나만** 돈다.
 *
 * 스켈레톤 한 조각마다 루프를 만들면 목록 한 화면에 20~30개의 타이머가 동시에 돌고,
 * 조각마다 위상이 달라 화면이 지글거린다. 모듈 수준 값 하나를 공유하면
 * 모든 조각이 같은 박자로 숨쉬고 타이머는 하나뿐이다.
 */
const pulse = new Animated.Value(0);
let pulseSubscribers = 0;
let pulseLoop: Animated.CompositeAnimation | null = null;

/** 1 → 0.45 로 숨쉰다. 완전히 사라지면 레이아웃이 보이지 않아 스켈레톤의 의미가 없다 */
const pulseOpacity = pulse.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 0.45],
});

function startPulse() {
  pulseSubscribers += 1;
  if (pulseSubscribers > 1) {
    return;
  }
  pulseLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 720,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 720,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
  );
  pulseLoop.start();
}

function stopPulse() {
  pulseSubscribers -= 1;
  if (pulseSubscribers > 0) {
    return;
  }
  pulseLoop?.stop();
  pulseLoop = null;
  pulse.setValue(0);
}

/**
 * "동작 줄이기"(iOS 설정 > 손쉬운 사용, Android 접근성)를 켠 사용자에게는
 * 깜빡임을 주지 않는다. 전정기관 장애가 있는 사용자에게 반복 애니메이션은 통증이 된다.
 */
function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (alive) {
          setReduced(value);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** 기본값은 height 의 절반 (알약 모양). 사각 블록이 필요하면 명시한다 */
  radius?: number;
  style?: ViewStyle;
}

/** 스켈레톤 한 조각 (가로 막대 · 원 · 블록 전부 이걸로 만든다) */
export function Skeleton({ width = '100%', height = 12, radius, style }: SkeletonProps) {
  const { tokens } = useTheme();
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    startPulse();
    return stopPulse;
  }, [reduceMotion]);

  return (
    <Animated.View
      // 스크린리더는 "로딩 중" 한 번만 읽으면 된다. 조각마다 읽으면 소음이다
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? height / 2,
          backgroundColor: tokens.track,
        },
        reduceMotion ? { opacity: 0.7 } : { opacity: pulseOpacity },
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  /** 줄 수 */
  lines?: number;
  /** 마지막 줄은 짧게 — 실제 문단처럼 보이게 한다 */
  lastLineWidth?: DimensionValue;
  height?: number;
  gap?: number;
}

/** 여러 줄 텍스트 자리 */
export function SkeletonText({
  lines = 2,
  lastLineWidth = '60%',
  height = 12,
  gap = 7,
}: SkeletonTextProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={height}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

interface SkeletonRowProps {
  /** 카테고리 아이콘 자리 크기 — TransactionRow 는 40, 시트 안은 34 */
  iconSize?: number;
  /** 마지막 행에는 구분선을 넣지 않는다 */
  divider?: boolean;
}

/**
 * 거래 목록 행 한 줄 — TransactionRow 와 같은 골격.
 * (아이콘 · 제목/카테고리 2줄 · 오른쪽 금액)
 */
export function SkeletonRow({ iconSize = 40, divider = true }: SkeletonRowProps) {
  const { tokens } = useTheme();
  return (
    <View
      className="flex-row items-center gap-[11px] py-[11px]"
      style={divider ? { borderBottomWidth: 1, borderBottomColor: tokens.line } : null}>
      <Skeleton width={iconSize} height={iconSize} radius={12} />
      <View className="flex-1 gap-[7px]">
        <Skeleton width="52%" height={13} />
        <Skeleton width="30%" height={11} />
      </View>
      <Skeleton width={72} height={14} />
    </View>
  );
}

interface SkeletonListProps {
  rows?: number;
  iconSize?: number;
}

/** 거래 목록 여러 줄 */
export function SkeletonList({ rows = 6, iconSize = 40 }: SkeletonListProps) {
  return (
    <View>
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonRow key={index} iconSize={iconSize} divider={index !== rows - 1} />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * 카드 자리 — 안을 채우지 않으면 통짜 회색 블록, children 을 주면
 * 카드 테두리 안에 원하는 스켈레톤을 배치한다.
 */
export function SkeletonCard({ height, style, children }: SkeletonCardProps) {
  if (!children) {
    return <Skeleton height={height ?? 96} radius={18} style={style} />;
  }
  return (
    <View
      className="border border-line bg-surface p-[16px] dark:border-line-dark dark:bg-surface-dark"
      style={[{ borderRadius: 18 }, style]}>
      {children}
    </View>
  );
}
