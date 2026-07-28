import type { Transaction } from '@hanpun/shared';
import { formatSignedAmount, getCategoryLabel } from '@hanpun/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge } from './Badge';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  /** 하위 텍스트에 시각 대신 다른 문구를 쓸 때 */
  subtitle?: string;
}

/**
 * 거래 리스트 한 줄 (디자인 「카드/리스트」 카드).
 * 아이콘 칩 40 / 제목 15·600 / 보조 12.5 ink-2 / 금액 15·600
 */
export function TransactionRow({ transaction, onPress, subtitle }: Props) {
  const sub = subtitle ?? getCategoryLabel(transaction.categoryId);
  const income = transaction.type === 'income';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ? () => onPress(transaction) : undefined}
      className="flex-row items-center gap-[12px] py-[12px] active:opacity-60">
      <CategoryIcon categoryId={transaction.categoryId} />
      <View className="flex-1">
        <View className="flex-row items-center gap-[6px]">
          <Text numberOfLines={1} className="text-body font-semibold text-ink dark:text-ink-dark">
            {transaction.title}
          </Text>
          {transaction.recurringRuleId ? <Badge label="고정" /> : null}
        </View>
        <Text className="mt-[2px] text-[12.5px] text-ink-2 dark:text-ink-dark-2">{sub}</Text>
      </View>
      <Text
        className={`text-body font-semibold ${
          income ? 'text-orange-600 dark:text-orange-400' : 'text-ink dark:text-ink-dark'
        }`}>
        {formatSignedAmount(transaction.amount, transaction.type)}
      </Text>
    </Pressable>
  );
}
