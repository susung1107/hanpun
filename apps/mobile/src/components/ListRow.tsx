import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { iconSize, palette } from '../theme/tokens';

interface Props {
  icon?: LucideIcon;
  /** 아이콘 칩 색 오버라이드 (회원 탈퇴처럼 위험 액션) */
  iconTint?: string;
  iconColor?: string;
  title: string;
  /** 제목 아래 보조 설명 */
  description?: string;
  /** 우측 값 텍스트 */
  value?: string;
  valueTone?: 'default' | 'good' | 'accent';
  chevron?: boolean;
  /** 우측 토글 — 값이 주어지면 스위치를 그린다 */
  toggle?: { value: boolean; onValueChange: (next: boolean) => void };
  onPress?: () => void;
  danger?: boolean;
  /** 하단 구분선 (카드 안 마지막 행은 false) */
  divider?: boolean;
  right?: React.ReactNode;
}

/**
 * 설정·목록 공통 행 (디자인 settings/account 카드).
 * 아이콘 칩 34×34 radius 10 / 제목 14.5·600 / 설명 12 ink-2 / 값 12~13 / 쉐브론 16 ink-3
 */
export function ListRow({
  icon: Icon,
  iconTint,
  iconColor,
  title,
  description,
  value,
  valueTone = 'default',
  chevron = false,
  toggle,
  onPress,
  danger = false,
  divider = true,
  right,
}: Props) {
  const { tokens } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-[12px] py-[13px] ${
        divider ? 'border-b border-line dark:border-line-dark' : ''
      } ${onPress ? 'active:opacity-60' : ''}`}>
      {Icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconTint ?? tokens.neutralTint,
          }}>
          <Icon size={17} strokeWidth={1.9} color={iconColor ?? tokens.ink2} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text
          className={`text-[14.5px] font-semibold ${
            danger ? '' : 'text-ink dark:text-ink-dark'
          }`}
          style={danger ? { color: tokens.critical } : undefined}>
          {title}
        </Text>
        {description ? (
          <Text className="mt-[2px] text-[12px] text-ink-2 dark:text-ink-dark-2">{description}</Text>
        ) : null}
      </View>
      {value ? (
        <Text
          className="text-[12.5px] font-semibold"
          style={{
            color:
              valueTone === 'good'
                ? tokens.good
                : valueTone === 'accent'
                  ? tokens.accentText
                  : tokens.ink2,
          }}>
          {value}
        </Text>
      ) : null}
      {right}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onValueChange}
          trackColor={{ false: tokens.controlTrack, true: palette.orange500 }}
          thumbColor="#ffffff"
          ios_backgroundColor={tokens.controlTrack}
        />
      ) : null}
      {chevron ? <ChevronRight size={iconSize.inline} strokeWidth={1.9} color={tokens.ink3} /> : null}
    </Pressable>
  );
}

/** 섹션 라벨 — 12px / 700 / ink-3 (margin 14 4 6) */
export function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="mb-[6px] mt-[14px] flex-row items-baseline px-[4px]">
      <Text className="text-[12px] font-bold text-ink-3 dark:text-ink-dark-3">{title}</Text>
      {hint ? (
        <Text className="ml-[4px] text-[12px] text-ink-3 dark:text-ink-dark-3">{hint}</Text>
      ) : null}
    </View>
  );
}
