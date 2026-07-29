import { buildCalendarGrid, toDateKey, toMonthKey, WEEKDAY_KO } from '@hanpun/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface Props {
  visible: boolean;
  /** 현재 선택된 날짜 */
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  /** 미래 날짜 선택 차단 (거래 입력) */
  blockFuture?: boolean;
}

/**
 * 날짜 선택 바텀시트 (디자인 date-sheet).
 * 헤더 '2026년 7월' + 월 이동, 요일 헤더, 7열 날짜 그리드, [오늘][확인]
 */
export function DateSheet({ visible, value, onClose, onConfirm, blockFuture = true }: Props) {
  const { tokens } = useTheme();
  const [month, setMonth] = useState(() => toMonthKey(value));
  const [selected, setSelected] = useState(() => new Date(value));

  // 시트를 다시 열 때 현재 값으로 초기화
  React.useEffect(() => {
    if (visible) {
      setMonth(toMonthKey(value));
      setSelected(new Date(value));
    }
  }, [visible, value]);

  // 시트는 6주 고정 — 달을 넘길 때마다 시트 높이가 튀면 버튼 위치가 흔들린다
  const cells = buildCalendarGrid(month, 6);
  const [year, monthIndex] = month.split('-').map(Number);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selected);

  const shift = (delta: number) => {
    const base = new Date((year ?? 2026), (monthIndex ?? 1) - 1 + delta, 1);
    setMonth(toMonthKey(base));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="mb-[10px] flex-row items-center justify-between">
        <Text className="text-[16px] font-bold text-ink dark:text-ink-dark">
          {`${year}년 ${monthIndex}월`}
        </Text>
        <View className="flex-row items-center gap-[16px]">
          <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={8} onPress={() => shift(-1)}>
            <ChevronLeft size={18} strokeWidth={2} color={tokens.ink3} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={8} onPress={() => shift(1)}>
            <ChevronRight size={18} strokeWidth={2} color={tokens.ink3} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row">
        {WEEKDAY_KO.map(day => (
          <Text
            key={day}
            className="flex-1 text-center text-[11px] text-ink-3 dark:text-ink-dark-3">
            {day}
          </Text>
        ))}
      </View>

      <View className="mt-[4px] flex-row flex-wrap">
        {cells.map(cell => {
          const isSelected = cell.dateKey === selectedKey;
          const future = blockFuture && cell.dateKey > todayKey;
          const disabled = !cell.inCurrentMonth || future;
          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => setSelected(new Date(`${cell.dateKey}T00:00:00`))}
              style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? palette.orange500 : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: isSelected ? '700' : '400',
                    color: isSelected ? '#ffffff' : disabled ? tokens.ink3 : tokens.ink,
                  }}>
                  {cell.day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-[14px] flex-row gap-[10px]">
        <View className="flex-1">
          <Button
            label="오늘"
            variant="ghost"
            onPress={() => {
              const today = new Date();
              setMonth(toMonthKey(today));
              setSelected(today);
            }}
          />
        </View>
        <View className="flex-[2]">
          <Button label="확인" onPress={() => onConfirm(selected)} />
        </View>
      </View>
    </BottomSheet>
  );
}
