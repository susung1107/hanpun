import { formatMonthShort, formatNumber, formatTimeKo, toMonthKey, WEEKDAY_KO } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Receipt, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  ListCard,
  Pill,
  Screen,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
  SkeletonRow,
  TransactionRow,
} from '../components';
import { groupTransactionsByDate, useMonthTransactions } from '../hooks/useTransactions';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';

type Filter = 'all' | 'expense' | 'income';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'expense', label: '지출만' },
  { value: 'income', label: '수입만' },
];

/** 스켈레톤 필터 칩 너비 — 실제 라벨(전체·지출만·수입만) 길이에 맞춘 고정값 */
const SKELETON_FILTER_WIDTHS = [48, 66, 66];
/** 스켈레톤 날짜 섹션 당 행 수 (섹션 2개) */
const SKELETON_SECTION_ROWS = 4;

/** 월 전체 내역 (디자인 transactions) */
export function TransactionsScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Transactions'>>();
  const { tokens } = useTheme();
  const month = route.params?.month ?? toMonthKey(new Date());
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading } = useMonthTransactions(month);
  const rows = useMemo(() => data ?? [], [data]);

  const totals = useMemo(() => {
    const expense = rows.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = rows.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    return { expense, income, balance: income - expense };
  }, [rows]);

  const sections = useMemo(() => {
    const filtered = filter === 'all' ? rows : rows.filter(row => row.type === filter);
    return groupTransactionsByDate(filtered);
  }, [rows, filter]);

  const header = (
    <ScreenHeader
      title={`${formatMonthShort(month)} 내역`}
      onBack={navigation.goBack}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="검색"
          onPress={() => navigation.navigate('Search')}
          hitSlop={8}>
          <Search size={19} strokeWidth={1.9} color={tokens.ink3} />
        </Pressable>
      }
    />
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <TransactionsSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      <FlatList
        data={sections}
        keyExtractor={section => section.dateKey}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View className="mb-[12px] flex-row gap-[8px]">
              {FILTERS.map(item => (
                <Pill
                  key={item.value}
                  label={item.label}
                  selected={filter === item.value}
                  onPress={() => setFilter(item.value)}
                />
              ))}
            </View>

            <Card padded={false} className="px-[16px] py-[14px]">
              <View className="flex-row">
                <SummaryCell label="지출" value={`-${formatNumber(totals.expense)}`} />
                <SummaryCell label="수입" value={`+${formatNumber(totals.income)}`} color={tokens.good} />
                <SummaryCell
                  label="수지"
                  value={`${totals.balance >= 0 ? '+' : '-'}${formatNumber(
                    Math.abs(totals.balance),
                  )}`}
                />
              </View>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={Receipt}
            title="이 달에는 기록이 없어요"
            description={'다른 달을 확인하거나\n지금 바로 기록해보세요'}
            tone="neutral"
            paddingTop={50}
          />
        }
        renderItem={({ item }) => {
          const date = new Date(`${item.dateKey}T00:00:00`);
          const dayTotal = item.dayExpense > 0 ? -item.dayExpense : item.dayIncome;
          const isIncomeOnly = item.dayExpense === 0 && item.dayIncome > 0;
          return (
            <View className="mt-[10px]">
              <View className="mb-[6px] mt-[4px] flex-row items-center justify-between px-[4px]">
                <Text className="text-[12px] font-bold text-ink-3 dark:text-ink-dark-3">
                  {`${date.getDate()}일 ${WEEKDAY_KO[date.getDay()]}요일`}
                </Text>
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: isIncomeOnly ? tokens.good : tokens.ink3 }}>
                  {`${dayTotal >= 0 ? '+' : '-'}${formatNumber(Math.abs(dayTotal))}원`}
                </Text>
              </View>
              <ListCard className="px-[16px]">
                {item.items.map(row => (
                  <TransactionRow
                    key={row.id}
                    transaction={row}
                    subtitle={formatTimeKo(row.occurredAt)}
                    onPress={() => navigation.navigate('TransactionDetail', { id: row.id })}
                  />
                ))}
              </ListCard>
            </View>
          );
        }}
      />
    </Screen>
  );
}

/** 로딩 중 — 실제 내역 화면(필터 칩 → 월 요약 카드 → 날짜 섹션)의 골격을 회색으로 */
function TransactionsSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
      className="px-[18px] pt-[2px]">
      <View className="mb-[12px] flex-row gap-[8px]">
        {SKELETON_FILTER_WIDTHS.map((width, index) => (
          <Skeleton key={index} width={width} height={30} radius={15} />
        ))}
      </View>

      <SkeletonCard>
        <View className="flex-row">
          {[0, 1, 2].map(index => (
            <View key={index} className="flex-1 gap-[6px]">
              <Skeleton width={28} height={11} />
              <Skeleton width="70%" height={16} radius={5} />
            </View>
          ))}
        </View>
      </SkeletonCard>

      {[0, 1].map(section => (
        <View key={section} className="mt-[10px]">
          <View className="mb-[6px] mt-[4px] flex-row items-center justify-between px-[4px]">
            <Skeleton width={78} height={12} />
            <Skeleton width={62} height={12} />
          </View>
          <ListCard className="px-[16px]">
            {Array.from({ length: SKELETON_SECTION_ROWS }, (_, index) => (
              <SkeletonRow key={index} divider={false} />
            ))}
          </ListCard>
        </View>
      ))}
    </View>
  );
}

function SummaryCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] text-ink-3 dark:text-ink-dark-3">{label}</Text>
      <Text
        className="mt-[3px] text-[16px] font-bold text-ink dark:text-ink-dark"
        style={color ? { color } : undefined}>
        {value}
      </Text>
    </View>
  );
}
