import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  /** 0~1 이상 (초과 시 1로 잘리고 색이 경고색으로 바뀐다) */
  ratio: number;
  height?: number;
  /** 100% 초과분을 빨간색으로 표시 */
  warnOnOver?: boolean;
  color?: string;
  /** 트랙(빈 부분) 색. 기본은 tokens.track — 오렌지 면 위처럼 배경이 다를 때만 덮어쓴다 */
  trackColor?: string;
}

/** 진행 바 — track #f0efe9 / fill orange-500 / height 8 / radius 4 (디자인 「카드」 카드) */
export function ProgressBar({ ratio, height = 8, warnOnOver = true, color, trackColor }: Props) {
  const { tokens } = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const over = warnOnOver && ratio > 1;

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor ?? tokens.track,
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? (over ? tokens.critical : tokens.primary),
        }}
      />
    </View>
  );
}
