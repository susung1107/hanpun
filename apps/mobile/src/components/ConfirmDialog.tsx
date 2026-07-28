import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { CenterDialog } from './BottomSheet';
import { Button } from './Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  icon: LucideIcon;
  /** 아이콘 원 + 확인 버튼 색 — danger(빨강) / neutral(회색·주황 확인) */
  tone?: 'danger' | 'neutral';
  title: string;
  /** 본문 (\n 로 줄바꿈 가능) */
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  cancelLabel?: string;
}

/**
 * 확인 다이얼로그 (삭제·탈퇴·로그아웃 공통).
 * 아이콘 원 + 제목 + 본문 + [취소][확인] 두 버튼.
 */
export function ConfirmDialog({
  visible,
  onClose,
  icon: Icon,
  tone = 'danger',
  title,
  message,
  confirmLabel,
  onConfirm,
  loading = false,
  cancelLabel = '취소',
}: Props) {
  const { tokens } = useTheme();
  const danger = tone === 'danger';

  return (
    <CenterDialog visible={visible} onClose={onClose}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? tokens.criticalTint : tokens.neutralTint,
        }}>
        <Icon size={22} strokeWidth={1.9} color={danger ? tokens.critical : tokens.ink2} />
      </View>

      <Text className="mt-[14px] text-title2 font-bold text-ink dark:text-ink-dark">{title}</Text>
      <Text
        className="mt-[8px] text-center text-caption text-ink-2 dark:text-ink-dark-2"
        style={{ lineHeight: 21 }}>
        {message}
      </Text>

      <View className="mt-[18px] w-full flex-row gap-[10px]">
        <View className="flex-1">
          <Button label={cancelLabel} variant="ghost" onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button
            label={confirmLabel}
            variant={danger ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={loading}
          />
        </View>
      </View>
    </CenterDialog>
  );
}
