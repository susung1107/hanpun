import type { CategoryStat } from '@hanpun/shared';
import {
  formatMonthLong,
  formatNumber,
  getCategory,
  getCategoryLabel,
} from '@hanpun/shared';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ChartPie } from 'lucide-react-native';

import {
  Card,
  EmptyState,
  getCategoryIcon,
  MonthNav,
  MonthPickerSheet,
  Screen,
  SegmentedControl,
  Skeleton,
  SkeletonCard,
  StatTile,
  TabHeader,
  YearPickerSheet,
  type SegmentOption,
} from '../components';
import { useBudgetProgress } from '../hooks/useBudgets';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import { useMonthlyStats, useYearlyStats } from '../hooks/useStats';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

type Range = 'month' | 'year';

const RANGE_OPTIONS: SegmentOption<Range>[] = [
  { value: 'month', label: '월간' },
  { value: 'year', label: '연간' },
];

/**
 * 스켈레톤 막대 높이 비율 (12개월 = 12칸).
 * Math.random() 을 쓰면 렌더마다 막대가 들썩여 로딩이 시끄러워지므로, 자연스럽게
 * 들쭉날쭉한 값을 상수로 고정한다. 월별 차트(12칸)에 1:1, 일별 추이 막대에는 순환해 쓴다.
 */
const MONTH_BAR_RATIOS = [
  0.45, 0.62, 0.38, 0.7, 0.55, 0.85, 0.5, 0.68, 0.42, 0.9, 0.58, 0.75,
] as const;

/** 통계 (디자인 stats / stats-year) */
export function StatsScreen() {
  const { tokens } = useTheme();
  const [range, setRange] = useState<Range>('month');
  const { month, setMonth, goPrev, goNext, canGoNext } = useMonthNavigation();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [picker, setPicker] = useState(false);
  const [yearPicker, setYearPicker] = useState(false);

  const label =
    range === 'month' ? formatMonthLong(month) : `${year}년`;

  return (
    <Screen edges={{ bottom: false }}>
      <TabHeader
        title="통계"
        right={
          range === 'month' ? (
            <MonthNav
              label={label}
              onPrev={goPrev}
              onNext={goNext}
              canGoNext={canGoNext}
              onPressLabel={() => setPicker(true)}
            />
          ) : (
            <MonthNav
              label={label}
              onPrev={() => setYear(prev => prev - 1)}
              onNext={() => setYear(prev => prev + 1)}
              canGoNext={year < new Date().getFullYear()}
              onPressLabel={() => setYearPicker(true)}
              pressHint="연도 선택"
            />
          )
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View className="mb-[14px] items-center">
          <View style={{ width: 180 }}>
            <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
          </View>
        </View>

        {range === 'month' ? (
          <MonthlyStatsView month={month} />
        ) : (
          <YearlyStatsView year={year} />
        )}

        <Text className="mt-[16px] text-center text-[11.5px]" style={{ color: tokens.ink3 }}>
          {range === 'month' ? '카테고리 막대는 예산 대비 사용률이에요' : '연간은 월별 지출 합계 기준이에요'}
        </Text>
      </ScrollView>

      <MonthPickerSheet
        visible={picker}
        title="달 선택"
        year={Number(month.slice(0, 4))}
        month={Number(month.slice(5, 7))}
        onClose={() => setPicker(false)}
        onConfirm={(pickedYear, pickedMonth) => {
          setPicker(false);
          const key = `${pickedYear}-${String(pickedMonth).padStart(2, '0')}`;
          // 미래 달은 볼 게 없으니 이번 달을 넘기지 않는다
          const now = new Date();
          const capped = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          setMonth(key > capped ? capped : key);
        }}
      />

      <YearPickerSheet
        visible={yearPicker}
        year={year}
        maxYear={new Date().getFullYear()}
        onClose={() => setYearPicker(false)}
        onConfirm={picked => {
          setYearPicker(false);
          setYear(picked);
        }}
      />
    </Screen>
  );
}

/* ---------------------------------- 월간 ---------------------------------- */

function MonthlyStatsView({ month }: { month: string }) {
  const { tokens } = useTheme();
  const { data: stats, isLoading } = useMonthlyStats(month);
  const { data: progress } = useBudgetProgress(month);

  const budgetByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (progress ?? []).forEach(item => {
      if (item.categoryId) {
        map.set(item.categoryId, item.budgetAmount);
      }
    });
    return map;
  }, [progress]);

  if (isLoading || !stats) {
    return <MonthlyStatsSkeleton />;
  }

  if (stats.totalExpense === 0 && stats.totalIncome === 0) {
    return (
      <EmptyState
        icon={ChartPie}
        title="이번 달 기록이 없어요"
        description={'거래를 기록하면 카테고리별 지출과\n추이를 여기서 볼 수 있어요'}
      />
    );
  }

  const expenseStats = stats.byCategory
    .filter(stat => isExpenseStat(stat))
    .sort((a, b) => b.amount - a.amount);

  const top = expenseStats.slice(0, 6);
  const rest = expenseStats.slice(6);
  const restAmount = rest.reduce((acc, stat) => acc + stat.amount, 0);
  const restRatio = rest.reduce((acc, stat) => acc + stat.ratio, 0);

  const overBudget = expenseStats.filter(stat => {
    const budget = budgetByCategory.get(stat.categoryId) ?? 0;
    return budget > 0 && stat.amount > budget;
  });

  const diff = stats.totalExpense - stats.prevMonthExpense;
  const diffRatio =
    stats.prevMonthExpense > 0 ? Math.round((Math.abs(diff) / stats.prevMonthExpense) * 100) : 0;

  const maxDay = Math.max(...stats.byDay.map(day => day.expense), 1);

  return (
    <>
      <Card padded={false} className="px-[16px] py-[16px]">
        <View className="flex-row">
          <StatTile label="지출" value={formatNumber(stats.totalExpense)} />
          <StatTile label="수입" value={formatNumber(stats.totalIncome)} color={tokens.good} />
          <StatTile
            label="수지"
            value={`${stats.totalIncome - stats.totalExpense >= 0 ? '+' : '-'}${formatNumber(
              Math.abs(stats.totalIncome - stats.totalExpense),
            )}`}
          />
        </View>
      </Card>

      <Card padded={false} className="mt-[14px] px-[16px] py-[16px]">
        <View className="mb-[12px] flex-row items-baseline">
          <Text className="text-[13.5px] font-bold text-ink dark:text-ink-dark">
            카테고리별 지출
          </Text>
          <Text className="ml-[4px] text-[11px]" style={{ color: tokens.ink3 }}>
            · 예산 대비
          </Text>
        </View>

        {top.map(stat => {
          const budget = budgetByCategory.get(stat.categoryId) ?? 0;
          const usage = budget > 0 ? stat.amount / budget : stat.ratio;
          const over = budget > 0 && stat.amount > budget;
          return (
            <CategoryBar
              key={stat.categoryId}
              label={getCategoryLabel(stat.categoryId)}
              categoryId={stat.categoryId}
              ratio={Math.min(usage, 1)}
              over={over}
              amount={stat.amount}
              share={stat.ratio}
            />
          );
        })}

        {rest.length > 0 ? (
          <CategoryBar
            label="그 외"
            ratio={Math.min(restRatio, 1)}
            over={false}
            amount={restAmount}
            share={restRatio}
          />
        ) : null}

        {overBudget.length > 0 ? (
          <Text className="mt-[6px] text-[11px]" style={{ color: tokens.critical }}>
            {`● ${getCategoryLabel(overBudget[0]!.categoryId)} — 예산 ${formatNumber(
              budgetByCategory.get(overBudget[0]!.categoryId) ?? 0,
            )}원 초과`}
          </Text>
        ) : null}
      </Card>

      <Card padded={false} className="mt-[14px] px-[16px] py-[16px]">
        <Text className="mb-[12px] text-[13.5px] font-bold text-ink dark:text-ink-dark">
          일별 지출 추이
        </Text>
        <View style={{ height: 64, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
          {stats.byDay.map(day => {
            const height = Math.max((day.expense / maxDay) * 64, day.expense > 0 ? 3 : 2);
            const isMax = day.expense === maxDay && day.expense > 0;
            return (
              <View
                key={day.date}
                style={{
                  flex: 1,
                  height,
                  borderRadius: 3,
                  backgroundColor: isMax
                    ? palette.orange500
                    : day.expense > 0
                      ? palette.orange300
                      : tokens.chartEmpty,
                }}
              />
            );
          })}
        </View>
        <View className="mt-[6px] flex-row justify-between">
          {dayAxisLabels(month, stats.byDay.length).map(text => (
            <Text key={text} style={{ fontSize: 10, color: tokens.ink3 }}>
              {text}
            </Text>
          ))}
        </View>
      </Card>

      <Card padded={false} className="mt-[14px] flex-row items-center justify-between px-[16px] py-[14px]">
        <Text className={cx.caption}>전월 같은 기간 대비</Text>
        <Text
          className="text-caption font-bold"
          style={{
            color: diff <= 0 ? tokens.good : tokens.critical,
          }}>
          {stats.prevMonthExpense === 0
            ? '비교할 기록이 없어요'
            : `${diff <= 0 ? '-' : '+'}${formatNumber(Math.abs(diff))}원 (${
                diff <= 0 ? '↓' : '↑'
              }${diffRatio}%)`}
        </Text>
      </Card>
    </>
  );
}

/* ---------------------------------- 연간 ---------------------------------- */

function YearlyStatsView({ year }: { year: number }) {
  const { tokens } = useTheme();
  const { data: stats, isLoading } = useYearlyStats(year);

  if (isLoading || !stats) {
    return <YearlyStatsSkeleton />;
  }

  const months = stats.byMonth;
  const maxMonth = months.reduce(
    (acc, item) => (item.expense > acc.expense ? item : acc),
    months[0] ?? { month: '', expense: 0, income: 0 },
  );
  const max = Math.max(maxMonth.expense, 1);
  const recorded = months.filter(item => item.expense > 0).length;
  const average = recorded > 0 ? Math.round(stats.totalExpense / recorded) : 0;

  const topCategory = [...stats.byCategory]
    .filter(stat => isExpenseStat(stat))
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <>
      <Card padded={false} className="px-[16px] py-[16px]">
        <View className="flex-row">
          <StatTile label="연 지출" value={formatNumber(stats.totalExpense)} size={16} />
          <StatTile label="연 수입" value={formatNumber(stats.totalIncome)} color={tokens.good} size={16} />
          <StatTile label="월평균 지출" value={formatNumber(average)} size={16} />
        </View>
      </Card>

      <Card padded={false} className="mt-[14px] px-[16px] py-[16px]">
        <Text className="mb-[12px] text-[13.5px] font-bold text-ink dark:text-ink-dark">
          월별 지출
        </Text>
        <View style={{ height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          {months.map(item => {
            const isMax = item.expense === maxMonth.expense && item.expense > 0;
            const height = item.expense > 0 ? Math.max((item.expense / max) * 150, 4) : 3;
            return (
              <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: '100%',
                    maxWidth: 18,
                    height,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    backgroundColor:
                      item.expense === 0
                        ? tokens.chartEmpty
                        : isMax
                          ? palette.orange500
                          : palette.orange300,
                  }}
                />
              </View>
            );
          })}
        </View>
        <View className="mt-[6px] flex-row">
          {months.map(item => (
            <Text
              key={item.month}
              style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: tokens.ink3 }}>
              {monthNumber(item.month)}
            </Text>
          ))}
        </View>
        {maxMonth.expense > 0 ? (
          <Text className="mt-[10px] text-[11px] text-ink-2 dark:text-ink-dark-2">
            {`${monthNumber(maxMonth.month)}월이 가장 많이 쓴 달 · ${formatNumber(
              maxMonth.expense,
            )}원`}
          </Text>
        ) : null}
      </Card>

      {topCategory ? (
        <Card
          padded={false}
          className="mt-[14px] flex-row items-center justify-between px-[16px] py-[14px]">
          <Text className={cx.caption}>연간 최다 지출 카테고리</Text>
          <Text className="text-caption font-bold text-ink dark:text-ink-dark">
            {`${getCategoryLabel(topCategory.categoryId)} · ${Math.round(topCategory.ratio * 100)}%`}
          </Text>
        </Card>
      ) : null}
    </>
  );
}

/* -------------------------------- 스켈레톤 -------------------------------- */

/** 3칸 요약 카드(지출·수입·수지 / 연지출·연수입·월평균)의 골격 */
function SummarySkeleton({ labelWidth, valueWidth }: { labelWidth: number; valueWidth: number }) {
  return (
    <SkeletonCard>
      <View className="flex-row">
        {[0, 1, 2].map(index => (
          <View key={index} className="flex-1">
            <Skeleton width={labelWidth} height={11} />
            <Skeleton width={valueWidth} height={17} radius={5} style={{ marginTop: 5 }} />
          </View>
        ))}
      </View>
    </SkeletonCard>
  );
}

/**
 * 월간 뷰 로딩 골격 — 실제 MonthlyStatsView 의 4카드 구조를 그대로 재현한다.
 * 요약 카드 → 카테고리별 지출(6줄) → 일별 지출 추이(막대) → 전월 대비.
 * (실제 화면에 도넛이 없으므로 "도넛 자리"는 실제 막대 차트 자리로 맞췄다)
 */
function MonthlyStatsSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="불러오는 중">
      <SummarySkeleton labelWidth={34} valueWidth={58} />

      {/* 카테고리별 지출 — 아이콘 + 라벨 + 진행바 + 금액 6줄 */}
      <SkeletonCard style={{ marginTop: 14 }}>
        <Skeleton width={110} height={14} style={{ marginBottom: 14 }} />
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} className="mb-[10px] flex-row items-center gap-[8px]">
            <Skeleton width={28} height={28} radius={8} />
            <Skeleton width={46} height={12} />
            <View style={{ flex: 1 }}>
              <Skeleton width="100%" height={14} radius={4} />
            </View>
            <Skeleton width={56} height={12} />
          </View>
        ))}
      </SkeletonCard>

      {/* 일별 지출 추이 — 실제 막대 차트(height 64, 하단 정렬)의 자리 */}
      <SkeletonCard style={{ marginTop: 14 }}>
        <Skeleton width={96} height={14} style={{ marginBottom: 14 }} />
        <View style={{ height: 64, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
          {Array.from({ length: 30 }, (_, index) => (
            <View key={index} style={{ flex: 1 }}>
              <Skeleton
                width="100%"
                height={Math.max(MONTH_BAR_RATIOS[index % MONTH_BAR_RATIOS.length]! * 64, 3)}
                radius={3}
              />
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* 전월 대비 카드 */}
      <SkeletonCard style={{ marginTop: 14 }}>
        <View className="flex-row items-center justify-between">
          <Skeleton width={120} height={12} />
          <Skeleton width={92} height={12} />
        </View>
      </SkeletonCard>
    </View>
  );
}

/**
 * 연간 뷰 로딩 골격 — 실제 YearlyStatsView 의 3카드 구조를 그대로 재현한다.
 * 요약 카드 → 월별 지출(막대 12개, 하단 정렬) → 연간 최다 카테고리.
 * 막대 높이는 MONTH_BAR_RATIOS 로 고정한다.
 */
function YearlyStatsSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="불러오는 중">
      <SummarySkeleton labelWidth={48} valueWidth={62} />

      {/* 월별 지출 — 막대 12개(height 150, 하단 정렬) + 월 라벨 */}
      <SkeletonCard style={{ marginTop: 14 }}>
        <Skeleton width={72} height={14} style={{ marginBottom: 14 }} />
        <View style={{ height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          {MONTH_BAR_RATIOS.map((ratio, index) => (
            <View key={index} style={{ flex: 1, alignItems: 'center' }}>
              <Skeleton
                width="100%"
                height={Math.max(ratio * 150, 4)}
                radius={4}
                style={{ maxWidth: 18 }}
              />
            </View>
          ))}
        </View>
        <View className="mt-[6px] flex-row">
          {MONTH_BAR_RATIOS.map((_, index) => (
            <View key={index} style={{ flex: 1, alignItems: 'center' }}>
              <Skeleton width={12} height={9} />
            </View>
          ))}
        </View>
      </SkeletonCard>

      {/* 연간 최다 지출 카테고리 카드 */}
      <SkeletonCard style={{ marginTop: 14 }}>
        <View className="flex-row items-center justify-between">
          <Skeleton width={140} height={12} />
          <Skeleton width={90} height={12} />
        </View>
      </SkeletonCard>
    </View>
  );
}

/* --------------------------------- 조각들 --------------------------------- */

function CategoryBar({
  label,
  categoryId,
  ratio,
  over,
  amount,
  share,
}: {
  label: string;
  categoryId?: string;
  ratio: number;
  over: boolean;
  amount: number;
  share: number;
}) {
  const { tokens, isDark } = useTheme();
  const meta = categoryId ? getCategory(categoryId) : null;
  const Icon = meta ? getCategoryIcon(meta.icon) : null;

  return (
    <View className="mb-[10px] flex-row items-center">
      <View style={{ width: 82, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {Icon ? (
          <Icon
            size={13}
            strokeWidth={2.2}
            color={isDark ? meta!.strokeDark : meta!.stroke}
          />
        ) : null}
        <Text numberOfLines={1} className="text-[12px] text-ink dark:text-ink-dark">
          {label}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          height: 14,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: tokens.track,
        }}>
        <View
          style={{
            width: `${Math.max(Math.min(ratio, 1) * 100, 2)}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: over ? tokens.critical : palette.orange500,
          }}
        />
      </View>

      <Text
        numberOfLines={1}
        style={{
          width: 74,
          textAlign: 'right',
          fontSize: 12,
          fontWeight: '600',
          color: over ? tokens.critical : tokens.ink,
        }}>
        {formatNumber(amount)}
      </Text>
      <Text style={{ width: 32, textAlign: 'right', fontSize: 11, color: tokens.ink3 }}>
        {`${Math.round(share * 100)}%`}
      </Text>
    </View>
  );
}

function isExpenseStat(stat: CategoryStat): boolean {
  return getCategory(stat.categoryId).type === 'expense';
}

/** 'YYYY-MM' 또는 '7' 같은 값에서 월 숫자만 뽑는다 */
function monthNumber(month: string): string {
  const parts = month.split('-');
  return String(Number(parts[1] ?? parts[0] ?? 0));
}

/**
 * 스파크라인 x축 라벨.
 * 막대는 월 전체 일수만큼 균등 폭으로 그려지고 라벨은 justify-between 으로 균등 배치되므로,
 * 라벨도 균등 지점(1일 · 1/4 · 중간 · 3/4 · 말일)에서 뽑아야 막대와 날짜가 맞는다.
 */
function dayAxisLabels(month: string, days: number): string[] {
  if (days <= 0) {
    return [];
  }
  const monthLabel = Number(month.split('-')[1] ?? 1);
  const picked = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(ratio * (days - 1)) + 1);
  return [...new Set(picked)].map(day => `${monthLabel}.${day}`);
}
