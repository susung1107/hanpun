import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';

import { usePressed } from '../hooks/usePressed';
import { palette } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** 좌측 아이콘 (lucide 엘리먼트) */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * 버튼 (디자인 「버튼」 카드).
 * - primary: orange-500 → 누르면 orange-600, 비활성 #e5e3de / 텍스트 #a5a39c
 * - secondary: orange-50 배경 + orange-100 테두리 + orange-600 텍스트
 * - ghost: 배경 없음 + ink-2 텍스트
 * - danger: critical 배경 + 흰 텍스트 (삭제·탈퇴 등 파괴적 액션)
 *
 * 눌림 피드백은 usePressed 로 처리한다 — NativeWind 아래에서 함수형
 * style={({pressed}) => ...} 은 무시되므로 정적 style 을 유지해야 한다.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  style,
}: Props) {
  const inactive = disabled || loading;
  const md = size === 'md';
  const { pressed, pressHandlers } = usePressed();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      {...pressHandlers}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: md ? 14 : 10,
          paddingVertical: md ? 15 : 8,
          paddingHorizontal: md ? 24 : 14,
          borderWidth: variant === 'secondary' ? 1 : 0,
          ...backgroundFor(variant, inactive, pressed),
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={hasLightText(variant) ? '#ffffff' : palette.orange600} />
      ) : (
        <>
          {icon ? <View style={{ marginRight: 2 }}>{icon}</View> : null}
          <Text
            style={{
              fontSize: md ? 16 : 13,
              fontWeight: '600',
              color: textColorFor(variant, inactive),
            }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** 배경이 진해 흰색 텍스트/스피너를 쓰는 변형 */
function hasLightText(variant: Variant): boolean {
  return variant === 'primary' || variant === 'danger';
}

function backgroundFor(variant: Variant, inactive: boolean, pressed: boolean): ViewStyle {
  if (variant === 'primary') {
    return {
      backgroundColor: inactive ? palette.disabled : pressed ? palette.orange600 : palette.orange500,
    };
  }
  if (variant === 'danger') {
    return {
      backgroundColor: palette.critical,
      opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
    };
  }
  if (variant === 'secondary') {
    return {
      backgroundColor: pressed ? palette.orange100 : palette.orange50,
      borderColor: palette.orange100,
      opacity: inactive ? 0.5 : 1,
    };
  }
  return { backgroundColor: 'transparent', opacity: pressed ? 0.6 : inactive ? 0.5 : 1 };
}

function textColorFor(variant: Variant, inactive: boolean): string {
  if (variant === 'primary') {
    return inactive ? palette.disabledText : '#ffffff';
  }
  if (variant === 'danger') {
    return '#ffffff';
  }
  if (variant === 'secondary') {
    return palette.orange600;
  }
  return palette.ink2;
}
