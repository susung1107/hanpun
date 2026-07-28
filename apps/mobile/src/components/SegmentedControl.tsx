import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * 세그먼티드 컨트롤 (디자인 「버튼」 카드).
 * track #eeede9 / radius 12 / padding 3, 활성 필은 흰 배경 + orange-600 텍스트 + 그림자.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row rounded-chip bg-segment p-[3px] dark:bg-segment-dark">
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center justify-center rounded-[10px] py-[8px] ${
              active ? 'bg-surface dark:bg-[#3a3833]' : ''
            }`}
            style={
              active
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : undefined
            }>
            <Text
              className={`text-[14px] ${
                active
                  ? 'font-bold text-orange-600 dark:text-orange-400'
                  : 'font-medium text-ink-2 dark:text-ink-dark-2'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
