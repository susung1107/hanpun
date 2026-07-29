import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  /**
   * 가운데 라벨을 눌렀을 때. 넘기면 라벨이 버튼이 되어 달 선택 시트를 연다.
   * 안 넘기면 예전처럼 그냥 글자다(연 단위 네비 등 고를 게 없는 경우).
   */
  onPressLabel?: () => void;
}

/** ‹ 2026년 7월 › — 통계 화면 헤더의 기간 네비게이터 */
export function MonthNav({ label, onPrev, onNext, canGoNext = true, onPressLabel }: Props) {
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
      {onPressLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} — 눌러서 달 선택`}
          onPress={onPressLabel}
          hitSlop={8}
          className="items-center justify-center px-[2px] py-[4px]">
          <Text className="text-[14px] font-bold text-ink dark:text-ink-dark">{label}</Text>
        </Pressable>
      ) : (
        <Text className="text-[14px] font-bold text-ink dark:text-ink-dark">{label}</Text>
      )}
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
