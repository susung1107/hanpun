import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cx } from '../theme/classes';

interface Props extends ViewProps {
  /** 상단 안전영역만큼 패딩을 넣는다 (헤더가 있는 화면) */
  edges?: { top?: boolean; bottom?: boolean };
  className?: string;
}

/** 화면 최상위 컨테이너 — 배경색 + 안전영역 처리 */
export function Screen({ edges, className = '', children, style, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`${cx.page} ${className}`}
      style={[
        {
          paddingTop: edges?.top === false ? 0 : insets.top,
          paddingBottom: edges?.bottom ? insets.bottom : 0,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
