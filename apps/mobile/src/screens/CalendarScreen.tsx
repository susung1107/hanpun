import type { RecurringRule, Transaction } from '@hanpun/shared';
import {
  buildCalendarGrid,
  formatCompactWon,
  formatDateShort,
  formatMonthLong,
  formatNumber,
  getCategoryLabel,
  shiftMonth,
  toDateKey,
  toMonthKey,
  WEEKDAY_KO,
} from '@hanpun/shared';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet, CategoryIcon, Fab, Pill, Screen, TabHeader } from '../components';
import { useRecurringRules } from '../hooks/useRecurring';
import { useMonthTransactions } from '../hooks/useTransactions';
import { useAppNavigation } from '../navigation/hooks';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

/** 셀·월 블록 높이 — getItemLayout 으로 초기 스크롤 위치를 잡기 위해 고정한다 */
const CELL_HEIGHT = 48;
const CELL_GAP = 2;
const LABEL_HEIGHT = 26;
const MONTH_HEIGHT = LABEL_HEIGHT + 6 * (CELL_HEIGHT + CELL_GAP);

/** 과거 48개월 ~ 미래 12개월을 미리 깔고, 아래로 더 내리면 미래를 연장한다 */
const PAST_MONTHS = 48;
const FUTURE_MONTHS = 12;

/**
 * 날짜 칸 금액 표기 — 폭이 40px 남짓이라 '원' 을 빼고, 100만 이상만 만·억으로 줄인다.
 * (10만원대까지는 정확한 숫자가 더 유용하다)
 */
const CELL_MONEY = { unit: false, exactBelow: 1_000_000 } as const;

interface DaySelection {
  dateKey: string;
  items: Transaction[];
}

/** 캘린더 (디자인 calendar) — 아이폰 캘린더처럼 세로 무한 스크롤 */
export function CalendarScreen() {
  const navigation = useAppNavigation();
  const { tokens, isDark } = useTheme();
  const listRef = useRef<FlatList<string>>(null);

  const currentMonth = toMonthKey(new Date());
  const [future, setFuture] = useState(FUTURE_MONTHS);
  const [selected, setSelected] = useState<DaySelection | null>(null);
  const [hintVisible, setHintVisible] = useState(true);

  const months = useMemo(
    () =>
      Array.from({ length: PAST_MONTHS + future + 1 }, (_, index) =>
        shiftMonth(currentMonth, index - PAST_MONTHS),
      ),
    [currentMonth, future],
  );

  const { data: rules } = useRecurringRules();
  const plannedFor = useMemo(() => buildPlanner(rules ?? []), [rules]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: MONTH_HEIGHT,
      offset: MONTH_HEIGHT * index,
      index,
    }),
    [],
  );

  const goToday = () => {
    listRef.current?.scrollToIndex({ index: PAST_MONTHS, animated: true });
  };

  return (
    <Screen edges={{ bottom: false }}>
      <TabHeader title="캘린더" right={<Pill label="오늘" size="sm" selected onPress={goToday} />} />

      <View className="flex-row px-[18px] pb-[6px] pt-[8px]">
        {WEEKDAY_KO.map(day => (
          <Text
            key={day}
            className="flex-1 text-center text-[11px]"
            style={{ color: tokens.ink3 }}>
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={months}
          keyExtractor={month => month}
          getItemLayout={getItemLayout}
          initialScrollIndex={PAST_MONTHS}
          initialNumToRender={3}
          windowSize={5}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }}
          onScrollBeginDrag={() => setHintVisible(false)}
          onEndReachedThreshold={0.4}
          onEndReached={() => setFuture(prev => prev + 12)}
          renderItem={({ item }) => (
            <MonthBlock
              month={item}
              plannedFor={plannedFor}
              selectedDateKey={selected?.dateKey ?? null}
              onSelectDay={(dateKey, items) => setSelected({ dateKey, items })}
            />
          )}
        />

        {hintVisible ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 16,
              top: 12,
              borderRadius: 8,
              paddingHorizontal: 9,
              paddingVertical: 6,
              backgroundColor: isDark ? 'rgba(244,243,240,0.14)' : 'rgba(28,27,26,0.82)',
            }}>
            <Text style={{ fontSize: 10.5, color: '#ffffff', lineHeight: 15 }}>
              {'↕ 아이폰 캘린더처럼\n위아래 무한 스크롤'}
            </Text>
          </View>
        ) : null}
      </View>

      <Fab onPress={() => navigation.navigate('AddTransaction', {})} bottom={20} />

      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        scrollable
        title={undefined}>
        {selected ? <DaySheetBody selection={selected} /> : null}
      </BottomSheet>
    </Screen>
  );
}

interface MonthBlockProps {
  month: string;
  selectedDateKey: string | null;
  plannedFor: (dateKey: string) => { title: string; amount: number; type: 'expense' | 'income' } | null;
  onSelectDay: (dateKey: string, items: Transaction[]) => void;
}

/** 한 달 그리드 — 보이는 달만 자기 월 거래를 불러온다 */
function MonthBlock({ month, selectedDateKey, plannedFor, onSelectDay }: MonthBlockProps) {
  const { tokens } = useTheme();
  const { data } = useMonthTransactions(month);

  const byDay = useMemo(() => {
    const map = new Map<string, { expense: number; income: number; items: Transaction[] }>();
    (data ?? []).forEach(row => {
      const dateKey = toDateKey(new Date(row.occurredAt));
      const entry = map.get(dateKey) ?? { expense: 0, income: 0, items: [] };
      entry.items.push(row);
      if (row.type === 'expense') {
        entry.expense += row.amount;
      } else {
        entry.income += row.amount;
      }
      map.set(dateKey, entry);
    });
    return map;
  }, [data]);

  const cells = useMemo(() => buildCalendarGrid(month), [month]);
  const todayKey = toDateKey(new Date());

  return (
    <View style={{ height: MONTH_HEIGHT }}>
      <Text
        style={{ height: LABEL_HEIGHT, paddingTop: 7, paddingHorizontal: 4 }}
        className="text-[12.5px] font-bold text-ink-2 dark:text-ink-dark-2">
        {formatMonthLong(month)}
      </Text>

      <View className="flex-row flex-wrap">
        {cells.map(cell => {
          const entry = byDay.get(cell.dateKey);
          const selected = selectedDateKey === cell.dateKey;
          const isFuture = cell.dateKey > todayKey;
          const planned = !entry && isFuture ? plannedFor(cell.dateKey) : null;

          return (
            <Pressable
              key={cell.dateKey}
              accessibilityRole="button"
              accessibilityLabel={`${cell.day}일`}
              disabled={!cell.inCurrentMonth}
              onPress={() => onSelectDay(cell.dateKey, entry?.items ?? [])}
              style={{
                width: `${100 / 7}%`,
                height: CELL_HEIGHT,
                marginBottom: CELL_GAP,
              }}>
              <View
                style={{
                  flex: 1,
                  marginHorizontal: 1,
                  borderRadius: 10,
                  paddingVertical: 5,
                  paddingHorizontal: 3,
                  alignItems: 'center',
                  backgroundColor: selected ? palette.orange500 : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: cell.inCurrentMonth ? '600' : '400',
                    color: selected
                      ? '#ffffff'
                      : !cell.inCurrentMonth
                        ? tokens.ink3
                        : cell.dateKey === todayKey
                          ? tokens.accentText
                          : tokens.ink,
                  }}>
                  {cell.day}
                </Text>

                {cell.inCurrentMonth && entry && entry.expense > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 9.5,
                      fontWeight: '600',
                      marginTop: 1,
                      color: selected ? '#ffffff' : tokens.chart,
                    }}>
                    {`-${formatCompactWon(entry.expense, CELL_MONEY)}`}
                  </Text>
                ) : null}

                {cell.inCurrentMonth && entry && entry.income > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 9.5,
                      fontWeight: '600',
                      color: selected ? '#ffffff' : tokens.good,
                    }}>
                    {`+${formatCompactWon(entry.income, CELL_MONEY)}`}
                  </Text>
                ) : null}

                {cell.inCurrentMonth && planned ? (
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 9.5, marginTop: 1, color: tokens.ink3 }}>
                    {planned.title}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
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
        {selection.items.length > 0 ? (
          <Text className="text-[13px] font-bold" style={{ color: tokens.accentText }}>
            {`${expense > 0 ? `-${formatNumber(expense)}원` : `+${formatNumber(income)}원`} · ${
              selection.items.length
            }건`}
          </Text>
        ) : null}
      </View>

      {selection.items.length === 0 ? (
        <View className="items-center py-[26px]">
          <Text className={cx.caption}>
            이 날은 기록이 없어요
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('AddTransaction', { date: selection.dateKey })
            }
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
                <Text
                  numberOfLines={1}
                  className="text-[14px] text-ink dark:text-ink-dark">
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

/** 셀 안에는 자리가 없으니 100만 이상은 '2.85M' 로 줄인다 */
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
