import type { CategoryId, CategoryMeta } from '@hanpun/shared';
import { getCategory } from '@hanpun/shared';
import {
  Briefcase,
  Bus,
  ChartLine,
  Clapperboard,
  Coins,
  Ellipsis,
  Gift,
  HandCoins,
  HeartPulse,
  House,
  Lightbulb,
  PiggyBank,
  ShoppingBag,
  Smartphone,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { iconStroke } from '../theme/tokens';

/** CategoryMeta.icon(문자열) → lucide 컴포넌트 매핑 */
const ICONS: Record<string, LucideIcon> = {
  Utensils,
  Bus,
  House,
  Lightbulb,
  Smartphone,
  ShoppingBag,
  HeartPulse,
  Clapperboard,
  Gift,
  Ellipsis,
  Briefcase,
  HandCoins,
  PiggyBank,
  ChartLine,
  Coins,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICONS[name] ?? Ellipsis;
}

interface Props {
  categoryId: CategoryId;
  /** 칩(배경 사각형) 크기 — 리스트 40 / 선택 그리드 34 */
  size?: number;
  /** 아이콘 자체 크기 — 리스트 19 / 칩 17 */
  iconSize?: number;
  radius?: number;
}

/**
 * 카테고리 아이콘 칩.
 * 배경은 카테고리 tint, 스트로크는 카테고리 stroke 색을 사용한다(디자인 「아이콘」 카드).
 */
export function CategoryIcon({ categoryId, size = 40, iconSize = 19, radius = 12 }: Props) {
  const { isDark } = useTheme();
  const category: CategoryMeta = getCategory(categoryId);
  const Icon = getCategoryIcon(category.icon);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? category.tintDark : category.tint,
      }}>
      <Icon
        size={iconSize}
        strokeWidth={iconStroke.category}
        color={isDark ? category.strokeDark : category.stroke}
      />
    </View>
  );
}
