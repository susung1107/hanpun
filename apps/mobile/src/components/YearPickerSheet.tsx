import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MIN_YEAR, YEARS_PER_PAGE, yearPageStart } from '../lib/yearPage';
import { useTheme } from '../theme/ThemeProvider';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { NumberCell } from './MonthPickerSheet';

const YEAR_COLUMNS = 4;
const CELL_GAP = 6;

interface Props {
  visible: boolean;
  title?: string;
  /** 지금 선택된 해 */
  year: number;
  /** 고를 수 있는 가장 늦은 해 (보통 올해) */
  maxYear: number;
  onClose: () => void;
  onConfirm: (year: number) => void;
}

/**
 * 해 하나를 고르는 시트 (통계 '연간' 헤더).
 *
 * 달 선택 시트와 같은 껍데기 · 같은 칸(NumberCell)을 쓴다. 월간에서 연간으로 탭만
 * 옮겼는데 손이 다르게 움직여야 하면 매번 새로 배워야 하기 때문이다.
 *
 * 칸은 4열로 끊어 놓는다 — flexWrap 에 맡기면 기기 폭에 따라 열 수가 흔들린다
 * (MonthPickerSheet 와 같은 이유).
 */
export function YearPickerSheet({
  visible,
  title = '연도 선택',
  year,
  maxYear,
  onClose,
  onConfirm,
}: Props) {
  const { tokens } = useTheme();
  const [draft, setDraft] = useState(year);
  const [pageStart, setPageStart] = useState(() => yearPageStart(year, maxYear));

  useEffect(() => {
    if (visible) {
      setDraft(year);
      setPageStart(yearPageStart(year, maxYear));
    }
  }, [visible, year, maxYear]);

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => pageStart + index);
  const rows: number[][] = [];
  for (let i = 0; i < years.length; i += YEAR_COLUMNS) {
    rows.push(years.slice(i, i + YEAR_COLUMNS));
  }

  const canGoPrev = pageStart > MIN_YEAR;
  // 다음 묶음의 마지막 해가 올해를 넘으면 넘기지 않는다 — 미래는 고를 수 없다
  const canGoNext = pageStart + YEARS_PER_PAGE <= maxYear;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="mb-[14px] flex-row items-center justify-center gap-[16px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 12년"
          onPress={() => setPageStart(prev => prev - YEARS_PER_PAGE)}
          disabled={!canGoPrev}
          hitSlop={8}>
          <ChevronLeft size={18} strokeWidth={2} color={canGoPrev ? tokens.ink3 : tokens.line} />
        </Pressable>
        <Text className="text-[16px] font-bold text-ink dark:text-ink-dark">
          {`${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}년`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 12년"
          onPress={() => setPageStart(prev => prev + YEARS_PER_PAGE)}
          disabled={!canGoNext}
          hitSlop={8}>
          <ChevronRight size={18} strokeWidth={2} color={canGoNext ? tokens.ink3 : tokens.line} />
        </Pressable>
      </View>

      {rows.map((row, rowIndex) => (
        <View
          key={row[0]}
          style={{ flexDirection: 'row', marginTop: rowIndex === 0 ? 0 : CELL_GAP }}>
          {row.map((item, columnIndex) => (
            <View key={item} style={{ flex: 1, marginLeft: columnIndex === 0 ? 0 : CELL_GAP }}>
              <NumberCell
                label={`${item}`}
                selected={draft === item}
                onPress={() => setDraft(item)}
              />
            </View>
          ))}
        </View>
      ))}

      <View className="mt-[16px]">
        <Button label="확인" onPress={() => onConfirm(draft)} />
      </View>
    </BottomSheet>
  );
}
