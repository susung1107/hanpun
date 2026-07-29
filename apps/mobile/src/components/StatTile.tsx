import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  label: string;
  value: string;
  color?: string;
  size?: number;
  /** 값 아래 보조 문구 (예: 최다 지출일의 금액) */
  hint?: string;
}

/**
 * 숫자 지표 한 칸 — 라벨(위) · 값(아래) · 보조 문구(선택).
 * 통계 요약과 홈(수입·수지, 사용 현황)이 같은 모양을 쓰므로 공용으로 둔다.
 */
export function StatTile({ label, value, color, size = 17, hint }: Props) {
  const { tokens } = useTheme();
  return (
    <View className="flex-1">
      <Text style={{ fontSize: 11, color: tokens.ink3 }}>{label}</Text>
      <Text
        numberOfLines={1}
        style={{ marginTop: 4, fontSize: size, fontWeight: '700', color: color ?? tokens.ink }}>
        {value}
      </Text>
      {hint ? (
        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 11, color: tokens.ink3 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
