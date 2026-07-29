import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const MONTH_COLUMNS = 4;
const CELL_GAP = 6;

interface CellProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** 숫자 하나를 고르는 작은 칸 (월 · 일 선택) */
export function NumberCell({ label, selected, onPress }: CellProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-[38px] min-w-[44px] items-center justify-center rounded-[10px] border ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15'
          : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
      }`}>
      <Text
        className={`text-caption ${
          selected
            ? 'font-bold text-orange-600 dark:text-orange-400'
            : 'text-ink-2 dark:text-ink-dark-2'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  title: string;
  year: number;
  month: number;
  /** 왼쪽 보조 버튼 (예: 반복거래 '종료 없음') */
  clearLabel?: string;
  onClear?: () => void;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
}

/**
 * 연 + 월을 고르는 공용 시트.
 *
 * 원래 반복거래 화면 안에만 있었는데, 캘린더 · 통계 헤더의 '2026년 7월' 을 눌러
 * 달을 바꾸는 동작이 생기면서 **앱 전체가 같은 방식으로 달을 고르도록** 여기로
 * 옮겼다. 화면마다 다른 달력이 뜨면 같은 일을 하는데도 매번 새로 배워야 한다.
 *
 * 월 칸은 4열로 끊어 놓는다. `flexWrap` 에 맡기면 기기 폭에 따라 3열이 됐다
 * 4열이 됐다 하고, 마지막 줄이 왼쪽으로 쏠려 격자로 안 보인다.
 */
export function MonthPickerSheet({
  visible,
  title,
  year,
  month,
  clearLabel,
  onClear,
  onClose,
  onConfirm,
}: Props) {
  const { tokens } = useTheme();
  const [draftYear, setDraftYear] = useState(year);
  const [draftMonth, setDraftMonth] = useState(month);

  useEffect(() => {
    if (visible) {
      setDraftYear(year);
      setDraftMonth(month);
    }
  }, [visible, year, month]);

  const rows: number[][] = [];
  for (let i = 0; i < MONTHS.length; i += MONTH_COLUMNS) {
    rows.push(MONTHS.slice(i, i + MONTH_COLUMNS));
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="mb-[14px] flex-row items-center justify-center gap-[16px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 해"
          onPress={() => setDraftYear(prev => prev - 1)}
          hitSlop={8}>
          <ChevronLeft size={18} strokeWidth={2} color={tokens.ink3} />
        </Pressable>
        <Text className="text-[16px] font-bold text-ink dark:text-ink-dark">{`${draftYear}년`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 해"
          onPress={() => setDraftYear(prev => prev + 1)}
          hitSlop={8}>
          <ChevronRight size={18} strokeWidth={2} color={tokens.ink3} />
        </Pressable>
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={row[0]}
          style={{ flexDirection: 'row', marginTop: rowIndex === 0 ? 0 : CELL_GAP }}>
          {row.map((item, columnIndex) => (
            <View key={item} style={{ flex: 1, marginLeft: columnIndex === 0 ? 0 : CELL_GAP }}>
              <NumberCell
                label={`${item}월`}
                selected={draftMonth === item}
                onPress={() => setDraftMonth(item)}
              />
            </View>
          ))}
        </View>
      ))}

      <View className="mt-[16px] flex-row gap-[10px]">
        {clearLabel && onClear ? (
          <View className="flex-1">
            <Button label={clearLabel} variant="ghost" size="sm" onPress={onClear} />
          </View>
        ) : null}
        <View className="flex-1">
          <Button label="확인" onPress={() => onConfirm(draftYear, draftMonth)} />
        </View>
      </View>
    </BottomSheet>
  );
}
