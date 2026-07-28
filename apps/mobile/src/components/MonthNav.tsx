import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
}

/** ‹ 2026년 7월 › — 통계 화면 헤더의 기간 네비게이터 */
export function MonthNav({ label, onPrev, onNext, canGoNext = true }: Props) {
  const { tokens } = useTheme();
  return (
    <View className="flex-row items-center gap-[8px]">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전"
        onPress={onPrev}
        hitSlop={8}
        className="h-[28px] w-[24px] items-center justify-center">
        <ChevronLeft size={18} strokeWidth={2} color={tokens.ink3} />
      </Pressable>
      <Text className="text-[14px] font-bold text-ink dark:text-ink-dark">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다음"
        onPress={onNext}
        disabled={!canGoNext}
        hitSlop={8}
        className="h-[28px] w-[24px] items-center justify-center">
        <ChevronRight
          size={18}
          strokeWidth={2}
          color={canGoNext ? tokens.ink3 : tokens.line}
        />
      </Pressable>
    </View>
  );
}
