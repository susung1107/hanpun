import { formatNumber, parseAmountInput } from '@hanpun/shared';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

interface Props {
  /** 원 단위 정수 (0 이면 빈 입력으로 표시) */
  value: number;
  onChange: (value: number) => void;
  label?: string;
  autoFocus?: boolean;
  /** 수입 입력은 테두리·숫자를 good(초록)으로 (디자인 add-income) */
  tone?: 'expense' | 'income';
}

/**
 * 금액 입력 카드 (디자인 「입력」 카드).
 * radius 16 / 1.5px orange-500 테두리 / 우측 정렬 32px·700 / '원' 접미사 20px ink-2
 */
export function AmountInput({
  value,
  onChange,
  label = '금액',
  autoFocus = true,
  tone = 'expense',
}: Props) {
  const { tokens } = useTheme();
  const text = value > 0 ? formatNumber(value) : '';
  const accent = tone === 'income' ? tokens.good : palette.orange500;

  return (
    <View
      className="rounded-card border-[1.5px] bg-surface px-[16px] pb-[14px] pt-[12px] dark:bg-surface-dark"
      style={{ borderColor: accent }}>
      <Text className="text-[12px] text-ink-3 dark:text-ink-dark-3">{label}</Text>
      <View className="mt-[4px] flex-row items-end justify-end">
        <TextInput
          value={text}
          onChangeText={next => onChange(parseAmountInput(next))}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          placeholder="0"
          placeholderTextColor={tokens.ink3}
          maxLength={13}
          style={{
            flex: 1,
            fontSize: 32,
            fontWeight: '700',
            textAlign: 'right',
            color: tone === 'income' ? tokens.good : tokens.ink,
            padding: 0,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text
          className="ml-[6px] text-[20px] font-medium text-ink-2 dark:text-ink-dark-2"
          style={{ lineHeight: 34 }}>
          원
        </Text>
      </View>
    </View>
  );
}
