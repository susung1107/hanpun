import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 내용이 길 때 스크롤 허용 */
  scrollable?: boolean;
}

/**
 * 공용 바텀시트 (디자인 date-sheet / theme-sheet 공통 셸).
 * dim rgba(0,0,0,.45) + 시트 radius 24 상단 + handle 38×4
 */
export function BottomSheet({ visible, onClose, title, children, scrollable = false }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scrollable ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: tokens.overlay }}
      />
      <View
        style={{
          backgroundColor: tokens.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 10,
          paddingHorizontal: 20,
          paddingBottom: 20 + insets.bottom,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: -10 },
          elevation: 24,
        }}>
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: tokens.controlTrack,
            alignSelf: 'center',
            marginTop: 4,
            marginBottom: 14,
          }}
        />
        {title ? (
          <Text className="mb-[6px] text-[16px] font-bold text-ink dark:text-ink-dark">{title}</Text>
        ) : null}
        <Body>{children}</Body>
      </View>
    </Modal>
  );
}

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** 중앙 다이얼로그 셸 (삭제 확인 등) — radius 20 / padding 24 20 16 */
export function CenterDialog({ visible, onClose, children }: DialogProps) {
  const { tokens } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 36,
        }}>
        <View
          style={{
            width: '100%',
            backgroundColor: tokens.surface,
            borderRadius: 20,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 50,
            shadowOffset: { width: 0, height: 20 },
            elevation: 24,
          }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}
