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

const GRID_GAP = 8;

/**
 * 카테고리 선택 그리드.
 *
 * 폭을 퍼센트(`width: 20%`)로 주면 소수점이 기기마다 다르게 반올림돼 칩 사이
 * 간격이 들쭉날쭉해진다. 컨테이너 실제 폭을 재서 정수에 가까운 픽셀로 나눠,
 * 열 간격은 `marginLeft` 로 고정한다 — 어느 기기에서도 격자가 반듯하다.
 *
 * 폭을 재기 전(첫 프레임)에는 아무것도 그리지 않는다. 0 폭 칩이 잠깐 번쩍이는
 * 것보다 한 프레임 비는 편이 낫다.
 */
export function CategoryGrid({ type, value, onChange, columns = 5 }: GridProps) {
  const categories = getCategoriesByType(type);
  const [width, setWidth] = React.useState(0);

  const chipWidth = width > 0 ? (width - GRID_GAP * (columns - 1)) / columns : 0;

  const rows: CategoryMeta[][] = [];
  for (let i = 0; i < categories.length; i += columns) {
    rows.push(categories.slice(i, i + columns));
  }

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {chipWidth > 0
        ? rows.map((row, rowIndex) => (
            <View
              key={row[0].id}
              style={{ flexDirection: 'row', marginTop: rowIndex === 0 ? 0 : GRID_GAP }}>
              {row.map((category, columnIndex) => (
                <View
                  key={category.id}
                  style={{ width: chipWidth, marginLeft: columnIndex === 0 ? 0 : GRID_GAP }}>
                  <CategoryChip
                    category={category}
                    selected={category.id === value}
                    onPress={() => onChange(category.id)}
                  />
                </View>
              ))}
            </View>
          ))
        : null}
    </View>
  );
}
