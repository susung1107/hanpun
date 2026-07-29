import type { CalendarCell, RecurringRule, Transaction } from '@hanpun/shared';
import {
  buildCalendarGrid,
  formatAmountKo,
  formatCompactWon,
  formatDateShort,
  formatMonthLong,
  formatNumber,
  getCategoryLabel,
  shiftMonth,
  toDateKey,
  WEEKDAY_KO,
} from '@hanpun/shared';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  BottomSheet,
  CategoryIcon,
  Fab,
  MonthNav,
  MonthPickerSheet,
  Pill,
  Screen,
  Skeleton,
  TabHeader,
} from '../components';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import { useRecurringRules } from '../hooks/useRecurring';
import { useMonthTransactions, usePrefetchMonths } from '../hooks/useTransactions';
import { useAppNavigation } from '../navigation/hooks';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

/**
 * 캘린더는 **달 단위로 스냅되는 세로 무한 스크롤**이다.
 *
 * 한 화면에 한 달을 꽉 채워 그리고, 손을 떼면 달 경계에 딱 맞춰 멈춘다(`pagingEnabled`).
 * 달 이동은 세로 스크롤과 헤더의 ‹ › 버튼(해당 달로 `scrollToIndex`) 두 가지로 한다.
 *
 * 첫 렌더 함정: `initialScrollIndex` + `getItemLayout` 을 쓰는데 첫 프레임의 페이지
 * 높이가 0이면 캘린더가 통째로 빈 화면으로 뜬다. 그래서 격자 영역 높이를 `onLayout`
 * 으로 잰 **다음에만** FlatList 를 만든다. 높이를 재기 전 한 프레임은 같은 `MonthPage`
 * 를 flex:1 로 그려 두어 사용자가 차이를 못 느끼게 한다.
 *
 * 각 `MonthPage` 는 자기 달의 쿼리를 직접 든다 — 화면 단위로 한 달만 불러오면 스크롤
 * 도중 옆 달이 빈칸으로 보인다. 격자 계산(`buildCalendarGrid`)은 순수 함수라 날짜는
 * 항상 즉시 보이고 금액만 나중에 채워진다.
 */

/** 격자 좌우 여백 — 다른 화면(18)보다 좁게 잡아 한 달이 화면을 거의 채우게 한다 */
const GRID_PAD = 8;

/**
 * 주 한 줄의 높이 범위.
 *
 * `flex: 1` 로 남는 세로를 나눠 가지되, 위아래로 한계를 둔다.
 * 최소값이 없으면 작은 기기에서 금액 두 줄이 잘리고, 최대값이 없으면
 * 큰 화면·4주짜리 달에서 칸이 우스꽝스럽게 늘어난다.
 */
const ROW_MIN_HEIGHT = 56;
const ROW_MAX_HEIGHT = 108;

/** 하단 요약 띠 높이 — FAB(58) 이 앉을 자리이기도 하다. 격자와 FAB 이 겹치지 않는다 */
const FOOTER_HEIGHT = 74;

/**
 * 날짜 칸 금액 표기 — 폭이 45px 남짓이라 '원' 을 빼고, 100만 이상만 만·억으로 줄인다.
 * (10만원대까지는 정확한 숫자가 더 유용하다)
 */
const CELL_MONEY = { unit: false, exactBelow: 1_000_000 } as const;

/** 요일 헤더 색 — 한국 달력 관례대로 일요일만 빨강, 나머지는 같은 회색 */
const SUNDAY = 0;

/** 반복거래로 예정된 고정지출을 미리 보여주므로 앞 달로도 갈 수 있어야 한다 */
const MAX_FUTURE_MONTHS = 12;
const MAX_PAST_MONTHS = 48;

interface DaySelection {
  dateKey: string;
  items: Transaction[];
}

interface DayEntry {
  expense: number;
  income: number;
  items: Transaction[];
}

/** 캘린더 (디자인 calendar) — 한 달을 한 화면에 */
export function CalendarScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();

  const { month, setMonth, goPrev, goNext, goToday, canGoNext, isCurrentMonth, currentMonth } =
    useMonthNavigation({ maxFutureMonths: MAX_FUTURE_MONTHS });
  const [selected, setSelected] = useState<DaySelection | null>(null);
  const [picker, setPicker] = useState(false);

  const { data, isLoading } = useMonthTransactions(month);
  const { data: rules } = useRecurringRules();

  // 과거 48 + 이번 달 + 미래 12 = 61개월. 진짜 무한이 아니어도 5년치면 체감상 끝이 없고,
  // 가상화 범위가 유한해야 성능이 예측 가능하다.
  const months = useMemo(() => {
    const first = shiftMonth(currentMonth, -MAX_PAST_MONTHS);
    return Array.from({ length: MAX_PAST_MONTHS + MAX_FUTURE_MONTHS + 1 }, (_, index) =>
      shiftMonth(first, index),
    );
  }, [currentMonth]);

  // 옆 달을 미리 받아 둔다 — 스크롤이 도착하기 전에 금액이 이미 캐시에 있다.
  // windowSize={3} 이라 살아 있는 쿼리 범위가 이 프리페치 범위와 같아진다.
  const neighbours = useMemo(() => [shiftMonth(month, -1), shiftMonth(month, 1)], [month]);
  usePrefetchMonths(neighbours);

  const plannedFor = useMemo(() => buildPlanner(rules ?? []), [rules]);

  // 하단 요약 띠는 현재 보이는 달의 합계만 있으면 된다 (격자는 각 MonthPage 가 직접 든다)
  const { total } = useMemo(() => aggregateByDay(data ?? []), [data]);

  const todayKey = toDateKey(new Date());

  const [pageHeight, setPageHeight] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  // 버튼이 일으킨 스크롤과 스크롤이 일으킨 setMonth 가 서로 싸우지 않도록 현재 보이는 달을 따로 기억한다
  const shown = useRef(month);

  useEffect(() => {
    if (shown.current === month) {
      return;
    }
    shown.current = month;
    const index = months.indexOf(month);
    if (index < 0 || pageHeight === 0) {
      return;
    }
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [month, months, pageHeight]);

  const handleSettle = useCallback(
    (offsetY: number) => {
      if (pageHeight === 0) {
        return;
      }
      const index = Math.round(offsetY / pageHeight);
      const next = months[Math.min(Math.max(index, 0), months.length - 1)];
      if (!next || next === shown.current) {
        return;
      }
      shown.current = next;
      setSelected(null);
      setMonth(next);
    },
    [months, pageHeight, setMonth],
  );

  const handlePick = useCallback(
    (year: number, monthNumber: number) => {
      const key = `${year}-${String(monthNumber).padStart(2, '0')}`;
      const first = months[0];
      const last = months[months.length - 1];
      const clamped = !first || !last ? key : key < first ? first : key > last ? last : key;
      setPicker(false);
      setSelected(null);
      setMonth(clamped);
    },
    [months, setMonth],
  );

  const handleSelect = useCallback((dateKey: string, items: Transaction[]) => {
    setSelected({ dateKey, items });
  }, []);

  // 달이 바뀌면 열려 있던 날짜 선택을 버린다 (다른 달의 날짜가 남으면 안 된다)
  const handlePrev = useCallback(() => {
    setSelected(null);
    goPrev();
  }, [goPrev]);

  const handleNext = useCallback(() => {
    setSelected(null);
    goNext();
  }, [goNext]);

  const handleToday = useCallback(() => {
    setSelected(null);
    goToday();
  }, [goToday]);

  return (
    <Screen edges={{ bottom: false }}>
      <TabHeader
        title="캘린더"
        right={
          <View className="flex-row items-center gap-[6px]">
            {/* '오늘' 은 이번 달을 벗어났을 때만 — 늘 떠 있으면 헤더만 복잡해진다 */}
            {isCurrentMonth ? null : (
              <Pill label="오늘" size="sm" selected onPress={handleToday} />
            )}
            <MonthNav
              label={formatMonthLong(month)}
              onPrev={handlePrev}
              onNext={handleNext}
              canGoNext={canGoNext}
              onPressLabel={() => setPicker(true)}
            />
          </View>
        }
      />

      <View
        className="flex-row pb-[6px] pt-[2px]"
        style={{
          paddingHorizontal: GRID_PAD,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.line,
        }}>
        {WEEKDAY_KO.map((day, index) => (
          <Text
            key={day}
            className="flex-1 text-center text-[11px] font-semibold"
            style={{ color: index === SUNDAY ? tokens.critical : tokens.ink3 }}>
            {day}
          </Text>
        ))}
      </View>

      <View
        style={{ flex: 1 }}
        onLayout={event => setPageHeight(Math.round(event.nativeEvent.layout.height))}>
        {pageHeight === 0 ? (
          // 높이를 재기 전 한 프레임. 같은 컴포넌트를 flex:1 로 그려 두면 사용자는 차이를 못 느낀다
          <MonthPage
            month={month}
            height={0}
            todayKey={todayKey}
            planned={plannedFor}
            selectedKey={selected?.dateKey ?? null}
            onSelect={handleSelect}
          />
        ) : (
          <FlatList
            ref={listRef}
            // flex:1 이 없으면 스크롤 프레임이 콘텐츠 높이(61페이지)로 잡혀 pagingEnabled·
            // getItemLayout·initialScrollIndex 가 전부 어긋난다 — 현재 달로 못 가고 빈 과거 달에 갇힌다
            style={{ flex: 1 }}
            data={months}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <MonthPage
                month={item}
                height={pageHeight}
                todayKey={todayKey}
                planned={plannedFor}
                selectedKey={selected?.dateKey ?? null}
                onSelect={handleSelect}
              />
            )}
            getItemLayout={(_data, index) => ({
              length: pageHeight,
              offset: pageHeight * index,
              index,
            })}
            initialScrollIndex={Math.max(months.indexOf(currentMonth), 0)}
            onScrollToIndexFailed={info =>
              listRef.current?.scrollToOffset({ offset: info.index * pageHeight, animated: false })
            }
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            onMomentumScrollEnd={event => handleSettle(event.nativeEvent.contentOffset.y)}
          />
        )}
      </View>

      <View
        style={{
          height: FOOTER_HEIGHT,
          paddingLeft: GRID_PAD + 6,
          // FAB(오른쪽 20 + 지름 58) 자리를 비워 둔다 — 숫자가 버튼에 가리지 않게
          paddingRight: 86,
          justifyContent: 'center',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: tokens.line,
        }}>
        {isLoading ? (
          <View
            className="flex-row gap-[20px]"
            accessibilityRole="progressbar"
            accessibilityLabel="불러오는 중">
            <View className="gap-[6px]">
              <Skeleton width={24} height={10} />
              <Skeleton width={88} height={15} />
            </View>
            <View className="gap-[6px]">
              <Skeleton width={24} height={10} />
              <Skeleton width={72} height={15} />
            </View>
          </View>
        ) : (
          <View className="flex-row gap-[20px]">
            <View>
              <Text className={cx.caption}>지출</Text>
              <Text className="mt-[2px] text-[15px] font-bold" style={{ color: tokens.chart }}>
                {formatAmountKo(total.expense)}
              </Text>
            </View>
            <View>
              <Text className={cx.caption}>수입</Text>
              <Text className="mt-[2px] text-[15px] font-bold" style={{ color: tokens.good }}>
                {formatAmountKo(total.income)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <Fab onPress={() => navigation.navigate('AddTransaction', {})} />

      <BottomSheet visible={selected !== null} onClose={() => setSelected(null)} scrollable>
        {selected ? <DaySheetBody selection={selected} /> : null}
      </BottomSheet>

      <MonthPickerSheet
        visible={picker}
        title="달 선택"
        year={Number(month.slice(0, 4))}
        month={Number(month.slice(5, 7))}
        onClose={() => setPicker(false)}
        onConfirm={handlePick}
      />
    </Screen>
  );
}

interface MonthPageProps {
  month: string;
  height: number;
  todayKey: string;
  planned: (dateKey: string) => { title: string; amount: number; type: 'expense' | 'income' } | null;
  selectedKey: string | null;
  onSelect: (dateKey: string, items: Transaction[]) => void;
}

/** 한 달치 격자 (세로 페이징의 한 페이지) — export 하지 않는다 */
function MonthPage({ month, height, todayKey, planned, selectedKey, onSelect }: MonthPageProps) {
  const { tokens } = useTheme();

  // 페이지마다 자기 쿼리를 든다 — 화면 단위로 한 달만 불러오면 스크롤 도중 옆 달이 빈칸으로 보인다
  const { data, isLoading } = useMonthTransactions(month);
  const { byDay } = useMemo(() => aggregateByDay(data ?? []), [data]);

  /** 그 달에 필요한 주 수만 만든다 — 늘 6주로 그리면 5주짜리 달에 빈 줄이 남는다 */
  const weeks = useMemo(() => {
    const cells = buildCalendarGrid(month);
    const rows: CalendarCell[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }
    return rows;
  }, [month]);

  return (
    <View
      style={
        height > 0
          ? { height, paddingHorizontal: GRID_PAD }
          : { flex: 1, paddingHorizontal: GRID_PAD }
      }>
      {weeks.map((row, rowIndex) => (
        <View
          key={row[0]?.dateKey ?? rowIndex}
          className="flex-row"
          style={{
            flex: 1,
            minHeight: ROW_MIN_HEIGHT,
            maxHeight: ROW_MAX_HEIGHT,
            // 칸이 커진 만큼 줄 사이에 실선이 없으면 가로줄을 눈으로 못 따라간다
            borderBottomWidth: rowIndex === weeks.length - 1 ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: tokens.line,
          }}>
          {row.map(cell => (
            <DayCell
              key={cell.dateKey}
              cell={cell}
              entry={byDay.get(cell.dateKey)}
              planned={planned}
              todayKey={todayKey}
              loading={isLoading}
              selected={selectedKey === cell.dateKey}
              onSelect={onSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface DayCellProps {
  cell: CalendarCell;
  entry: DayEntry | undefined;
  planned: (dateKey: string) => { title: string; amount: number; type: 'expense' | 'income' } | null;
  todayKey: string;
  loading: boolean;
  selected: boolean;
  onSelect: (dateKey: string, items: Transaction[]) => void;
}

/** 날짜 한 칸 */
function DayCell({ cell, entry, planned, todayKey, loading, selected, onSelect }: DayCellProps) {
  const { tokens } = useTheme();

  const isToday = cell.dateKey === todayKey;
  const isFuture = cell.dateKey > todayKey;
  const upcoming = cell.inCurrentMonth && !entry && isFuture ? planned(cell.dateKey) : null;
  const isSunday = cell.date.getDay() === SUNDAY;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${cell.day}일`}
      accessibilityState={{ selected }}
      disabled={!cell.inCurrentMonth}
      onPress={() => onSelect(cell.dateKey, entry?.items ?? [])}
      style={{
        flex: 1,
        // 지난 달·다음 달 날짜는 자리만 지키고 뒤로 물러선다
        opacity: cell.inCurrentMonth ? 1 : 0.3,
      }}>
      <View
        style={{
          flex: 1,
          margin: 2,
          borderRadius: 12,
          paddingTop: 5,
          paddingHorizontal: 2,
          alignItems: 'center',
          backgroundColor: selected ? tokens.selectedBg : 'transparent',
          borderWidth: 1,
          borderColor: selected ? tokens.selectedBorder : 'transparent',
        }}>
        {/*
          오늘은 채운 원, 선택한 날은 칸 전체 틴트 — 둘을 다른 축으로 표현해야
          '오늘을 선택한 상태' 가 구분된다. (칸 전체를 주황으로 채우면 금액 글씨가
          흰색이 되어 지출·수입 색 구분이 사라진다)
        */}
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isToday ? palette.orange500 : 'transparent',
          }}>
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: isToday || selected ? '700' : '500',
              color: isToday ? '#ffffff' : isSunday ? tokens.critical : tokens.ink,
            }}>
            {cell.day}
          </Text>
        </View>

        {/*
          날짜는 이미 다 그려져 있고 **금액만** 기다린다 — 그 자리에 스켈레톤을 둔다.
          화면 전체를 스켈레톤으로 덮으면 이미 확정된 날짜까지 가려 오히려 느려 보인다.
        */}
        {loading && cell.inCurrentMonth ? (
          <Skeleton width="70%" height={8} style={{ marginTop: 5 }} />
        ) : null}

        {!loading && cell.inCurrentMonth && entry && entry.expense > 0 ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, lineHeight: 13, fontWeight: '600', color: tokens.chart }}>
            {`-${formatCompactWon(entry.expense, CELL_MONEY)}`}
          </Text>
        ) : null}

        {!loading && cell.inCurrentMonth && entry && entry.income > 0 ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, lineHeight: 13, fontWeight: '600', color: tokens.good }}>
            {`+${formatCompactWon(entry.income, CELL_MONEY)}`}
          </Text>
        ) : null}

        {!loading && upcoming ? (
          <Text numberOfLines={1} style={{ fontSize: 9.5, lineHeight: 13, color: tokens.ink3 }}>
            {upcoming.title}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** 날짜별 합계 + 그 달 총계 */
function aggregateByDay(rows: Transaction[]) {
  const map = new Map<string, DayEntry>();
  const sum = { expense: 0, income: 0 };

  rows.forEach(row => {
    const dateKey = toDateKey(new Date(row.occurredAt));
    const entry = map.get(dateKey) ?? { expense: 0, income: 0, items: [] };
    entry.items.push(row);
    if (row.type === 'expense') {
      entry.expense += row.amount;
      sum.expense += row.amount;
    } else {
      entry.income += row.amount;
      sum.income += row.amount;
    }
    map.set(dateKey, entry);
  });

  return { byDay: map, total: sum };
}

/** 날짜 상세 시트 (디자인 calendar 하단 시트) */
function DaySheetBody({ selection }: { selection: DaySelection }) {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();

  const expense = selection.items
    .filter(item => item.type === 'expense')
    .reduce((acc, item) => acc + item.amount, 0);
  const income = selection.items
    .filter(item => item.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0);

  const iso = new Date(`${selection.dateKey}T00:00:00`).toISOString();

  return (
    <View>
      <View className="flex-row items-center justify-between pb-[4px]">
        <Text className="text-[15px] font-bold text-ink dark:text-ink-dark">
          {formatDateShort(iso)}
        </Text>
        {/* 지출·수입이 같은 날 다 있을 수 있다 — 둘 다 있으면 둘 다 보여준다 */}
        {selection.items.length > 0 ? (
          <View className="flex-row items-center gap-[8px]">
            {expense > 0 ? (
              <Text className="text-[13px] font-bold" style={{ color: tokens.chart }}>
                {`-${formatNumber(expense)}원`}
              </Text>
            ) : null}
            {income > 0 ? (
              <Text className="text-[13px] font-bold" style={{ color: tokens.good }}>
                {`+${formatNumber(income)}원`}
              </Text>
            ) : null}
            <Text className="text-[12.5px] text-ink-3 dark:text-ink-dark-3">
              {`${selection.items.length}건`}
            </Text>
          </View>
        ) : null}
      </View>

      {selection.items.length === 0 ? (
        <View className="items-center py-[26px]">
          <Text className={cx.caption}>이 날은 기록이 없어요</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('AddTransaction', { date: selection.dateKey })}
            className="mt-[10px] active:opacity-60">
            <Text className="text-caption font-semibold" style={{ color: tokens.accentText }}>
              + 이 날에 기록 추가
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 320 }}>
          {selection.items.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
              className={`flex-row items-center gap-[11px] py-[10px] active:opacity-60 ${
                index === selection.items.length - 1
                  ? ''
                  : 'border-b border-line dark:border-line-dark'
              }`}>
              <CategoryIcon categoryId={item.categoryId} size={34} iconSize={17} radius={10} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[14px] text-ink dark:text-ink-dark">
                  {item.title}
                </Text>
                <Text className="mt-[2px] text-[11.5px] text-ink-2 dark:text-ink-dark-2">
                  {getCategoryLabel(item.categoryId)}
                </Text>
              </View>
              <Text
                className="text-[14px] font-semibold"
                style={{ color: item.type === 'income' ? tokens.good : tokens.ink }}>
                {`${item.type === 'income' ? '+' : '-'}${formatNumber(item.amount)}원`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/**
 * 미래 날짜에 표시할 예정 고정지출 — 활성 반복거래에서 해당 날짜에 걸리는 첫 항목.
 * (짧은 달은 말일로 처리, 서버 스케줄러와 같은 규칙)
 */
function buildPlanner(rules: RecurringRule[]) {
  const active = rules.filter(rule => rule.active);

  return (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const day = date.getDate();

    const hit = active.find(rule => {
      const startsAt = new Date(rule.startsAt);
      if (date < startsAt) {
        return false;
      }
      if (rule.endsAt && date > new Date(rule.endsAt)) {
        return false;
      }
      if (rule.cycle === 'weekly') {
        return date.getDay() === rule.dayAnchor;
      }
      const anchor = Math.min(rule.dayAnchor, lastDay);
      if (rule.cycle === 'yearly') {
        return day === anchor && date.getMonth() + 1 === (rule.month ?? 1);
      }
      return day === anchor;
    });

    return hit ? { title: hit.title, amount: hit.amount, type: hit.type } : null;
  };
}
