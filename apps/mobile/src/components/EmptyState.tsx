import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** 배지 톤 — accent(주황) / neutral(회색) */
  tone?: 'accent' | 'neutral';
  /** 하단 추천 필 (예: 혹시 "스타벅스"를 찾으셨나요?) */
  footer?: React.ReactNode;
  paddingTop?: number;
}

/**
 * 빈 상태 (디자인 empty-home / empty-search 카드).
 * 배지 76×76 radius 24 / 아이콘 34 / 제목 16·700 / 설명 13.5 ink-2 line-height 1.65
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'accent',
  footer,
  paddingTop = 70,
}: Props) {
  const { tokens } = useTheme();
  const badgeBg = tone === 'accent' ? tokens.accentTint : tokens.neutralTint;
  const iconColor = tone === 'accent' ? palette.orange500 : tokens.ink3;

  return (
    <View style={{ alignItems: 'center', paddingTop, paddingHorizontal: 34 }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: badgeBg,
        }}>
        <Icon size={34} strokeWidth={1.8} color={iconColor} />
      </View>
      <Text className="mt-[16px] text-center text-[16px] font-bold text-ink dark:text-ink-dark">
        {title}
      </Text>
      {description ? (
        <Text
          className="mt-[6px] text-center text-[13.5px] text-ink-2 dark:text-ink-dark-2"
          style={{ lineHeight: 22 }}>
          {description}
        </Text>
      ) : null}
      {footer ? <View className="mt-[16px]">{footer}</View> : null}
    </View>
  );
}
