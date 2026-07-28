import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { iconSize } from '../theme/tokens';

interface BaseProps {
  label: string;
}

interface SelectProps extends BaseProps {
  /** 표시 값 — 없으면 placeholder */
  value?: string;
  placeholder?: string;
  onPress: () => void;
}

/**
 * 탭하면 시트가 열리는 입력 행 (디자인 「입력」 카드).
 * radius 14 / 1.5px line 테두리 / 라벨 14 ink-2 폭 64 / 값 15 / 쉐브론 16 ink-3
 */
export function SelectRow({ label, value, placeholder, onPress }: SelectProps) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center rounded-field border-[1.5px] border-line bg-surface px-[14px] py-[13px] active:opacity-70 dark:border-line-dark dark:bg-surface-dark">
      <Text className="w-[64px] text-[14px] text-ink-2 dark:text-ink-dark-2">{label}</Text>
      <Text
        numberOfLines={1}
        className={`flex-1 text-body ${
          value ? 'text-ink dark:text-ink-dark' : 'text-ink-3 dark:text-ink-dark-3'
        }`}>
        {value || placeholder}
      </Text>
      <ChevronRight size={iconSize.inline} strokeWidth={1.9} color={tokens.ink3} />
    </Pressable>
  );
}

interface InputProps extends BaseProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

/** 직접 타이핑하는 입력 행 (내역·메모) */
export function InputRow({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  autoFocus,
  onSubmitEditing,
}: InputProps) {
  const { tokens } = useTheme();
  return (
    <View
      className={`flex-row rounded-field border-[1.5px] border-line bg-surface px-[14px] dark:border-line-dark dark:bg-surface-dark ${
        multiline ? 'py-[12px]' : 'items-center py-[13px]'
      }`}>
      <Text
        className={`w-[64px] text-[14px] text-ink-2 dark:text-ink-dark-2 ${
          multiline ? 'pt-[2px]' : ''
        }`}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.ink3}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="done"
        style={{
          flex: 1,
          fontSize: 15,
          color: tokens.ink,
          padding: 0,
          minHeight: multiline ? 56 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
