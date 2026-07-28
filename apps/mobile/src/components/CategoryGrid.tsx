import type { CategoryId, CategoryMeta, TransactionType } from '@hanpun/shared';
import { getCategoriesByType } from '@hanpun/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { iconStroke } from '../theme/tokens';
import { getCategoryIcon } from './CategoryIcon';

interface ChipProps {
  category: CategoryMeta;
  selected: boolean;
  onPress: () => void;
}

/**
 * 카테고리 선택 칩 (디자인 「카테고리 칩」 카드).
 * 칩 34 / 아이콘 17·stroke 1.9 / 이름 12·500
 * 선택 시 orange-50 배경 + orange-500 테두리 + orange-600 700
 */
export function CategoryChip({ category, selected, onPress }: ChipProps) {
  const { isDark } = useTheme();
  const Icon = getCategoryIcon(category.icon);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`items-center rounded-field border px-[6px] py-[10px] ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15'
          : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
      }`}>
      <View
        className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
        style={{ backgroundColor: isDark ? category.tintDark : category.tint }}>
        <Icon
          size={17}
          strokeWidth={iconStroke.category}
          color={isDark ? category.strokeDark : category.stroke}
        />
      </View>
      <Text
        numberOfLines={1}
        className={`mt-[6px] text-[12px] ${
          selected
            ? 'font-bold text-orange-600 dark:text-orange-400'
            : 'font-medium text-ink-2 dark:text-ink-dark-2'
        }`}>
        {category.label}
      </Text>
    </Pressable>
  );
}

interface GridProps {
  type: TransactionType;
  value: CategoryId;
  onChange: (id: CategoryId) => void;
  /** 한 줄에 놓는 칩 수 (지출 10개 → 5열 2행, 수입 5개 → 5열 1행) */
  columns?: number;
}

/** 카테고리 선택 그리드 */
export function CategoryGrid({ type, value, onChange, columns = 5 }: GridProps) {
  const categories = getCategoriesByType(type);
  const gap = 8;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {categories.map(category => (
        <View key={category.id} style={{ width: `${100 / columns}%`, paddingRight: 0 }}>
          <View style={{ paddingRight: gap }}>
            <CategoryChip
              category={category}
              selected={category.id === value}
              onPress={() => onChange(category.id)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
