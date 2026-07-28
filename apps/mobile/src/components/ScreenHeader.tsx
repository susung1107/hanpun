import { ChevronLeft, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  title?: string;
  /** 뒤로가기 대신 닫기(X) 아이콘 — 모달 화면 */
  closeIcon?: boolean;
  onBack?: () => void;
  /** 우측 액션 (텍스트 버튼 아이콘 등) */
  right?: React.ReactNode;
}

/** 상세·설정류 화면의 공통 헤더 (좌 뒤로가기 / 중앙 타이틀 / 우 액션) */
export function ScreenHeader({ title, closeIcon = false, onBack, right }: Props) {
  const { tokens } = useTheme();
  const Icon = closeIcon ? X : ChevronLeft;

  return (
    <View className="h-[52px] flex-row items-center px-[12px]">
      <View className="w-[64px] items-start">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeIcon ? '닫기' : '뒤로'}
            onPress={onBack}
            hitSlop={8}
            className="h-[36px] w-[36px] items-center justify-center">
            <Icon size={closeIcon ? 20 : 24} strokeWidth={1.9} color={tokens.ink} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-1 items-center">
        {title ? (
          <Text className="text-title2 font-semibold text-ink dark:text-ink-dark">{title}</Text>
        ) : null}
      </View>
      <View className="w-[64px] flex-row items-center justify-end">{right}</View>
    </View>
  );
}
