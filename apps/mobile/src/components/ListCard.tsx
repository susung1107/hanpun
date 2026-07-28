import React from 'react';
import { View } from 'react-native';

import { Card } from './Card';

interface Props {
  children: React.ReactNode;
  /** Card 에 넘길 추가 className (좌우 패딩 등) — 기본 px-[16px] */
  className?: string;
}

/**
 * 행들을 카드에 담고 **사이에 자동으로 구분선**을 넣는다.
 * 화면마다 반복되던 `map` + `index === last ? '' : 'border-b …'` 보일러플레이트를 대체한다.
 *
 * ```tsx
 * <ListCard>
 *   {rows.map(row => <SomeRow key={row.id} … />)}
 * </ListCard>
 * ```
 */
export function ListCard({ children, className = 'px-[16px]' }: Props) {
  const rows = React.Children.toArray(children);
  return (
    <Card padded={false} className={className}>
      {rows.map((child, index) => (
        <View
          key={(React.isValidElement(child) && child.key) || index}
          className={index === rows.length - 1 ? '' : 'border-b border-line dark:border-line-dark'}>
          {child}
        </View>
      ))}
    </Card>
  );
}
