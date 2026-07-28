import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cx } from '../theme/classes';

interface Props extends ViewProps {
  /** 홈 요약 카드처럼 radius 18 을 쓸 때 */
  large?: boolean;
  /** 기본 내부 여백 18 (디자인 「카드」 카드) */
  padded?: boolean;
  className?: string;
}

export function Card({ large = false, padded = true, className = '', children, ...rest }: Props) {
  return (
    <View
      className={`${large ? cx.cardLg : cx.card} ${padded ? 'p-[18px]' : ''} ${className}`}
      {...rest}>
      {children}
    </View>
  );
}
