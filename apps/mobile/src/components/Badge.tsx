import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  label: string;
  tone?: 'accent' | 'neutral' | 'critical' | 'good';
}

/** 작은 배지 — '고정' 뱃지 규격 (10.5px / 700 / radius 6) */
export function Badge({ label, tone = 'accent' }: Props) {
  const classes = TONES[tone];
  return (
    <View className={`rounded-[6px] px-[5px] py-[2px] ${classes.bg}`}>
      <Text className={`text-[10.5px] font-bold ${classes.text}`}>{label}</Text>
    </View>
  );
}

const TONES = {
  accent: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  neutral: { bg: 'bg-track dark:bg-track-dark', text: 'text-ink-2 dark:text-ink-dark-2' },
  critical: { bg: 'bg-critical-tint dark:bg-critical-tint-dark', text: 'text-critical dark:text-[#e2635f]' },
  good: { bg: 'bg-good-tint dark:bg-good-tint-dark', text: 'text-good dark:text-[#3fbf4a]' },
} as const;
