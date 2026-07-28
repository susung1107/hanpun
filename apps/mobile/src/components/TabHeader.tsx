import React from 'react';
import { Text, View } from 'react-native';

import { cx } from '../theme/classes';

interface Props {
  title: string;
  /** 우측 액션 (MonthNav · Pill 등) */
  right?: React.ReactNode;
}

/**
 * 탭 화면 공통 헤더 (통계·캘린더·설정).
 * 패딩은 `px-[22px] pb-[10px] pt-[6px]` 로 통일한다.
 */
export function TabHeader({ title, right }: Props) {
  return (
    <View className="flex-row items-center justify-between px-[22px] pb-[10px] pt-[6px]">
      <Text className={cx.screenTitle}>{title}</Text>
      {right ?? null}
    </View>
  );
}
