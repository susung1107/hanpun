import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';

import { usePressed } from '../hooks/usePressed';
import { palette, iconSize, iconStroke, layout } from '../theme/tokens';

interface Props {
  onPress: () => void;
}

/**
 * 플로팅 액션 버튼 — 58px 원형 + 주황 그림자 (디자인 「버튼」 카드).
 * 눌림 색은 usePressed 로 처리한다(정적 style 유지 — 함수형 style 은 NativeWind 가 무시).
 * 위치는 화면마다 같아야 하므로 layout.fabRight/fabBottom 한 곳에서만 정한다.
 */
export function Fab({ onPress }: Props) {
  const { pressed, pressHandlers } = usePressed();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="거래 추가"
      onPress={onPress}
      {...pressHandlers}
      style={{
        position: 'absolute',
        right: layout.fabRight,
        bottom: layout.fabBottom,
        width: layout.fabSize,
        height: layout.fabSize,
        borderRadius: layout.fabSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? palette.orange600 : palette.orange500,
        shadowColor: palette.orange500,
        shadowOpacity: 0.38,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}>
      <Plus size={iconSize.fab} strokeWidth={iconStroke.fab} color="#ffffff" />
    </Pressable>
  );
}
