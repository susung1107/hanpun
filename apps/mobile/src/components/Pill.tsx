import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 필터용(12px) vs 주기 선택용(13px) */
  size?: 'sm' | 'md';
}

/**
 * 알약 버튼 (필터 칩 반복 주기 필).
 * 선택 시 orange-50 배경 + orange-500 테두리 + orange-600 700
 */
export function Pill({ label, selected = false, onPress, size = 'md' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-[999px] border-[1.5px] ${
        size === 'md' ? 'px-[16px] py-[8px]' : 'px-[12px] py-[6px]'
      } ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15'
          : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
      }`}>
      <Text
        className={`${size === 'md' ? 'text-[13px]' : 'text-[12px]'} ${
          selected
            ? 'font-bold text-orange-600 dark:text-orange-400'
            : 'font-medium text-ink-2 dark:text-ink-dark-2'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
