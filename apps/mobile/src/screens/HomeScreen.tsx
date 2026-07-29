import {
  describeMonthOverMonth,
  formatAmountKo,
  formatBudgetWon,
  formatCompactWon,
  formatNumber,
  formatPercent,
  formatRelativeDay,
  formatTimeKo,
  formatWon,
  getCategory,
  getCategoryLabel,
  toDateKey,
  toMonthKey,
} from '@hanpun/shared';
import type { RecurringRule } from '@hanpun/shared';
import { Bell, CalendarCheck, ChevronRight, Receipt } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  Card,
  CategoryIcon,
  EmptyState,
  Fab,
  ListCard,
  ProgressBar,
  Screen,
  Skeleton,
  SkeletonCard,
  SkeletonRow,
  StatTile,
  TransactionRow,
} from '../components';
import { useBudgetProgress } from '../hooks/useBudgets';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { useRecurringRules } from '../hooks/useRecurring';
import { useMonthlyStats } from '../hooks/useStats';
import { useMonthTransactions } from '../hooks/useTransactions';
import { syncReminder } from '../lib/reminder';
import { useAppNavigation } from '../navigation/hooks';
import { useSettingsStore } from '../store/settingsStore';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';
import { iconStroke, layout, palette } from '../theme/tokens';

/**
 * 메인 카드 — 채도 높은 오렌지 슬래브 대신 은은한 웜 틴트 면.
 * 색으로 소리치는 대신 살구빛 배경 + 큰 오렌지 숫자 + 브랜드 게이지로 위계를 만든다.
 * 밝은 배경이라 글씨 대비 걱정이 없어 의미색(절약=초록/증가=빨강)도 그대로 쓸 수 있다.
 */
const HERO_BG_LIGHT = palette.orange50; // 부드러운 살구 아이보리
const HERO_BG_DARK = palette.surfaceDark2; // 따뜻한 다크 면
const HERO_BORDER_LIGHT = palette.orange100;
const HERO_BORDER_DARK = palette.orangeBorderDark;
const HERO_AMOUNT_LIGHT = palette.orange700; // 깊은 번트 오렌지 숫자
const HERO_AMOUNT_DARK = palette.orangeAccentDark;

const WEEK_BAR_HEIGHT = 52;

interface WeekBucket {
  label: string;
  expense: number;
  current: boolean;
}

function buildWeekly(
  days: { date: string; expense: number }[],
  todayKey: string,
): { weeks: WeekBucket[]; max: number } {
  const count = Math.max(Math.ceil(days.length / 7), 1);
  const weeks: WeekBucket[] = Array.from({ length: count }, (_, index) => ({
    label: `${index + 1}주`,
    expense: 0,
    current: false,
  }));
  days.forEach(day => {
    const dayOfMonth = Number(day.date.slice(8, 10));
    const index = Math.min(Math.max(Math.floor((dayOfMonth - 1) / 7), 0), count - 1);
    const bucket = weeks[index];
    if (!bucket) {
      return;
    }
    bucket.expense += day.expense;
    if (day.date === todayKey) {
      bucket.current = true;
    }
  });
  return { weeks, max: Math.max(...weeks.map(week => week.expense), 1) };
}

const TOP_CATEGORY_COUNT = 3;

const UPCOMING_PREVIEW = 3;

interface UpcomingItem {
  key: string;
  title: string;
  amount: number;
  day: number;
}

function buildUpcomingFixed(
  rules: RecurringRule[],
  today: Date,
): { items: UpcomingItem[]; total: number } {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const items: UpcomingItem[] = [];
  rules
    .filter(rule => rule.active && rule.type === 'expense')
    .forEach(rule => {
      const startsAt = new Date(rule.startsAt);
      const endsAt = rule.endsAt ? new Date(rule.endsAt) : null;
      // 31일 규칙이 30일까지인 달에서 사라지지 않도록 말일로 당긴다
      const anchor = Math.min(rule.dayAnchor, lastDay);
      for (let day = today.getDate() + 1; day <= lastDay; day += 1) {
        const date = new Date(year, monthIndex, day);
        if (date < startsAt || (endsAt && date > endsAt)) {
          continue;
        }
        const hit =
          rule.cycle === 'weekly'
            ? date.getDay() === rule.dayAnchor
            : rule.cycle === 'yearly'
              ? day === anchor && monthIndex + 1 === (rule.month ?? 1)
              : day === anchor;
        if (hit) {
          items.push({ key: `${rule.id}-${day}`, title: rule.title, amount: rule.amount, day });
        }
      }
    });
  items.sort((a, b) => a.day - b.day);
  return { items, total: items.reduce((sum, item) => sum + item.amount, 0) };
}

/** 홈 (디자인 home / empty-home) */
export function HomeScreen() {
  const navigation = useAppNavigation();
  const { tokens, isDark } = useTheme();
  const month = toMonthKey(new Date());
  const [year, monthNumber] = month.split('-');

  const stats = useMonthlyStats(month);
  const transactions = useMonthTransactions(month);
  const progress = useBudgetProgress(month);
  const unread = useUnreadNotificationCount();
  const recurring = useRecurringRules();

  const reminderEnabled = useSettingsStore(state => state.reminderEnabled);
  const reminderTime = useSettingsStore(state => state.reminderTime);

  const rows = useMemo(() => transactions.data ?? [], [transactions.data]);
  const todayKey = toDateKey(new Date());

  const today = useMemo(() => {
    const items = rows.filter(row => toDateKey(new Date(row.occurredAt)) === todayKey);
    const expense = items
      .filter(row => row.type === 'expense')
      .reduce((sum, row) => sum + row.amount, 0);
    return { count: items.length, expense, hasRecord: items.length > 0 };
  }, [rows, todayKey]);

  // 오늘 이미 입력했으면 저녁 리마인더를 내일로 미룬다(기획 확정)
  useEffect(() => {
    syncReminder({
      enabled: reminderEnabled,
      time: reminderTime,
      hasTodayRecord: today.hasRecord,
    }).catch(() => undefined);
  }, [reminderEnabled, reminderTime, today.hasRecord]);

  const totalExpense = stats.data?.totalExpense ?? 0;
  const totalIncome = stats.data?.totalIncome ?? 0;
  const balance = totalIncome - totalExpense;
  const compare = describeMonthOverMonth(totalExpense, stats.data?.prevMonthExpense ?? 0);

  // 예산 0원은 "예산 없음"과 같게 다룬다 — 나누면 비율이 무한대가 되어 "0원 중 5000000%" 같은 문구가 나온다
  const monthBudget = (progress.data ?? []).find(item => item.categoryId === null);
  const totalBudget = monthBudget && monthBudget.budgetAmount > 0 ? monthBudget : undefined;
  const budgetRatio = totalBudget ? totalBudget.spentAmount / totalBudget.budgetAmount : 0;
  const remaining = totalBudget ? totalBudget.budgetAmount - totalBudget.spentAmount : 0;

  const weekly = useMemo(
    () => buildWeekly(stats.data?.byDay ?? [], todayKey),
    [stats.data?.byDay, todayKey],
  );

  // 이번 달 사용 현황 요약 — 추가 API 없이 받아온 stats·rows 로 전부 계산한다
  const usage = useMemo(() => {
    const elapsed = Math.max(new Date().getDate(), 1);
    const peak = (stats.data?.byDay ?? []).reduce<{ day: number; amount: number } | null>(
      (best, day) => {
        if (day.expense <= 0) {
          return best;
        }
        const dayNumber = Number(day.date.slice(8, 10));
        return !best || day.expense > best.amount ? { day: dayNumber, amount: day.expense } : best;
      },
      null,
    );
    return {
      dailyAverage: Math.round(totalExpense / elapsed),
      expenseCount: rows.filter(row => row.type === 'expense').length,
      peak,
    };
  }, [stats.data?.byDay, totalExpense, rows]);

  const topCategories = useMemo(
    () =>
      (stats.data?.byCategory ?? [])
        .filter(stat => getCategory(stat.categoryId).type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_CATEGORY_COUNT),
    [stats.data?.byCategory],
  );

  const upcoming = useMemo(
    () => buildUpcomingFixed(recurring.data ?? [], new Date()),
    [recurring.data],
  );

  const recent = rows.slice(0, 3);
  const isEmpty = !transactions.isLoading && rows.length === 0;

  const refreshing = transactions.isFetching && !transactions.isLoading;

  // 헤더는 확정된 정보라 그대로 두고, 요약·목록 자리만 스켈레톤으로 채운다
  if (transactions.isLoading || stats.isLoading) {
    return (
      <Screen>
        <View className="flex-row items-center justify-between px-[22px] pb-[10px] pt-[6px]">
          <View className="flex-row items-baseline gap-[6px]">
            <Text className={cx.title1}>{`${Number(monthNumber)}월`}</Text>
            <Text className={cx.caption}>{year}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            onPress={() => navigation.navigate('Notifications')}
            className="h-[36px] w-[36px] items-center justify-center rounded-[18px] border border-line bg-surface active:opacity-70 dark:border-line-dark dark:bg-surface-dark">
            <Bell size={17} strokeWidth={iconStroke.default} color={tokens.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}>
          <HomeSkeleton />
        </ScrollView>
        <Fab onPress={() => navigation.navigate('AddTransaction')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-[22px] pb-[10px] pt-[6px]">
        <View className="flex-row items-baseline gap-[6px]">
          <Text className={cx.title1}>{`${Number(monthNumber)}월`}</Text>
          <Text className={cx.caption}>{year}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `알림 ${unread}건` : '알림'}
          onPress={() => navigation.navigate('Notifications')}
          className="h-[36px] w-[36px] items-center justify-center rounded-[18px] border border-line bg-surface active:opacity-70 dark:border-line-dark dark:bg-surface-dark">
          <Bell size={17} strokeWidth={iconStroke.default} color={tokens.ink} />
          {unread > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 7,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: tokens.primary,
              }}
            />
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              transactions.refetch();
              stats.refetch();
              progress.refetch();
            }}
            tintColor={tokens.ink3}
          />
        }>
        {/* ① 메인 카드 — 은은한 웜 틴트 면. 색으로 소리치지 않고 큰 오렌지 숫자와 게이지로 위계를 만든다.
            밝은 배경이라 글씨 대비 걱정이 없어 의미색(절약/증가)도 그대로 쓴다.
            isEmpty 여도 이 카드는 ₩0 과 안내 문구로 그려지고, 그 아래에 EmptyState 가 온다. */}
        <View
          style={{
            borderRadius: layout.cardRadius,
            padding: 20,
            backgroundColor: isDark ? HERO_BG_DARK : HERO_BG_LIGHT,
            borderWidth: 1,
            borderColor: isDark ? HERO_BORDER_DARK : HERO_BORDER_LIGHT,
          }}>
          <Text className="text-[12.5px] font-semibold text-ink-3 dark:text-ink-dark-3">
            이번 달 총 지출
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: 36,
              fontWeight: '700',
              letterSpacing: -0.5,
              color: isDark ? HERO_AMOUNT_DARK : HERO_AMOUNT_LIGHT,
            }}>
            {formatWon(totalExpense)}
          </Text>

          {isEmpty ? (
            <Text className="mt-[10px] text-[12.5px] text-ink-3 dark:text-ink-dark-3">
              기록을 남기면 이번 달 흐름이 여기 쌓여요
            </Text>
          ) : (
            // 밝은 틴트 위라 톤(good/warn) 색을 그대로 쓴다 — 절약=초록, 증가=빨강.
            // compare.text 에 이미 ↓/↑ 화살표가 들어 있어 아이콘을 덧붙이지 않는다.
            <Text
              className="mt-[10px] text-[12.5px] font-semibold"
              style={{
                color:
                  compare.tone === 'good'
                    ? tokens.good
                    : compare.tone === 'warn'
                      ? tokens.critical
                      : tokens.ink2,
              }}>
              {compare.text}
            </Text>
          )}

          <View className="mt-[16px] h-[1px] bg-line dark:bg-line-dark" />

          <View className="mt-[16px]">
            {totalBudget ? (
              <>
                {/* 브랜드 오렌지 게이지 + 기본 트랙. 예산 초과 시 warnOnOver 로 바가 빨개진다 */}
                <ProgressBar ratio={budgetRatio} height={10} />
                <View className="mt-[8px] flex-row items-center justify-between">
                  <Text className="text-[12px] text-ink-2 dark:text-ink-dark-2">
                    {`예산 ${formatBudgetWon(totalBudget.budgetAmount)} 중 ${Math.round(
                      budgetRatio * 100,
                    )}%`}
                  </Text>
                  {remaining >= 0 ? (
                    <Text className="text-[12px] font-bold text-ink dark:text-ink-dark">
                      {`잔여 ${formatAmountKo(remaining)}`}
                    </Text>
                  ) : (
                    <Text className="text-[12px] font-bold" style={{ color: tokens.critical }}>
                      {`초과 ${formatAmountKo(-remaining)}`}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Budget')}
                className="active:opacity-70">
                <Text className="text-[13px] font-bold text-orange-600 dark:text-orange-400">
                  예산 설정하기 ›
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {isEmpty ? (
          <EmptyState
            icon={Receipt}
            title="아직 기록이 없어요"
            description={'오른쪽 아래 + 버튼을 눌러\n오늘 첫 지출을 기록해보세요'}
          />
        ) : (
          <>
            {/* ② 오늘 지출 — 색 배너를 없애고 중립 카드 행으로 (홈의 색 면은 메인 카드 하나) */}
            <Card className="mt-[14px]" padded={false}>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('AddTransaction')}
                className="flex-row items-center px-[16px] py-[13px] active:opacity-70">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: tokens.accentTint,
                  }}>
                  <CalendarCheck size={18} strokeWidth={iconStroke.default} color={tokens.primary} />
                </View>
                <View className="flex-1" style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 11.5, color: tokens.ink3 }}>오늘 지출</Text>
                  <Text style={{ marginTop: 2, fontSize: 16, fontWeight: '700', color: tokens.ink }}>
                    {today.count > 0 ? formatAmountKo(today.expense) : '아직 기록이 없어요'}
                  </Text>
                </View>
                {today.count > 0 ? (
                  <View
                    style={{
                      borderRadius: 999,
                      backgroundColor: tokens.neutralTint,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: tokens.ink2 }}>
                      {`${today.count}건`}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.accentText }}>
                    기록하기 ›
                  </Text>
                )}
              </Pressable>
            </Card>

            {/* ③ 수입 · 수지 — 메인 카드에서 빼내 StatTile 로 크게 */}
            <Card className="mt-[14px]" padded={false}>
              <View className="flex-row items-center px-[16px] py-[16px]">
                <StatTile label="수입" value={`+${formatNumber(totalIncome)}`} color={tokens.good} />
                <View
                  style={{
                    width: 1,
                    alignSelf: 'stretch',
                    marginHorizontal: 16,
                    backgroundColor: tokens.line,
                  }}
                />
                <StatTile
                  label="수지"
                  value={`${balance >= 0 ? '+' : '-'}${formatNumber(Math.abs(balance))}`}
                  color={balance < 0 ? tokens.critical : tokens.ink}
                />
              </View>
            </Card>

            {/* ④ 많이 쓴 카테고리 — 얇은 막대로 순위를 바로 읽히게 */}
            {topCategories.length > 0 ? (
              <Card className="mt-[14px]">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="통계 화면으로 이동"
                  onPress={() => navigation.navigate('Tabs', { screen: 'Stats' })}
                  className="flex-row items-center justify-between active:opacity-70">
                  <Text className={cx.sectionTitle}>많이 쓴 카테고리</Text>
                  <ChevronRight size={18} strokeWidth={iconStroke.default} color={tokens.ink3} />
                </Pressable>
                <View className="mt-[8px]">
                  {topCategories.map(stat => (
                    <View
                      key={stat.categoryId}
                      className="mt-[10px] flex-row items-center gap-[12px]">
                      <CategoryIcon
                        categoryId={stat.categoryId}
                        size={34}
                        iconSize={17}
                        radius={10}
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text style={{ fontSize: 14, fontWeight: '500', color: tokens.ink }}>
                            {getCategory(stat.categoryId).label}
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: tokens.ink }}>
                            {formatAmountKo(stat.amount)}
                          </Text>
                        </View>
                        <View className="mt-[6px] flex-row items-center">
                          <View className="flex-1">
                            <ProgressBar ratio={stat.ratio} height={4} warnOnOver={false} />
                          </View>
                          <Text style={{ marginLeft: 8, fontSize: 11.5, color: tokens.ink3 }}>
                            {formatPercent(stat.ratio)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {/* ⑤ 이번 달 사용 현황 — 요약 3칸 + 주간 막대(기존 '주간 지출' 카드를 흡수) */}
            <Card className="mt-[14px]">
              <Text className={cx.sectionTitle}>이번 달 사용 현황</Text>
              <View className="mt-[14px] flex-row">
                <StatTile
                  label="하루 평균"
                  value={formatCompactWon(usage.dailyAverage)}
                  size={16}
                />
                <StatTile label="지출 건수" value={`${usage.expenseCount}건`} size={16} />
                <StatTile
                  label="최다 지출일"
                  value={usage.peak ? `${usage.peak.day}일` : '—'}
                  size={16}
                  hint={usage.peak ? formatCompactWon(usage.peak.amount) : undefined}
                />
              </View>

              <View
                className="mt-[18px] flex-row items-end gap-[10px]"
                style={{ height: WEEK_BAR_HEIGHT }}>
                {weekly.weeks.map(week => {
                  const barColor =
                    week.expense === 0
                      ? tokens.chartEmpty
                      : week.current
                        ? palette.orange500
                        : palette.orange300;
                  const barHeight = Math.max((week.expense / weekly.max) * WEEK_BAR_HEIGHT, 3);
                  return (
                    <View key={week.label} className="flex-1 items-center justify-end">
                      <View
                        style={{
                          width: '100%',
                          height: barHeight,
                          borderRadius: 6,
                          backgroundColor: barColor,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="mt-[8px] flex-row gap-[10px]">
                {weekly.weeks.map(week => (
                  <Text
                    key={week.label}
                    className="flex-1 text-center text-[11px] text-ink-3 dark:text-ink-dark-3">
                    {week.label}
                  </Text>
                ))}
              </View>
            </Card>

            {/* ⑥ 이번 달 남은 고정지출 — 남은 예정이 없으면 카드를 그리지 않는다 */}
            {upcoming.items.length > 0 ? (
              <Card className="mt-[14px]">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="고정지출 화면으로 이동"
                  onPress={() => navigation.navigate('Recurring')}
                  className="flex-row items-center justify-between active:opacity-70">
                  <Text className={cx.sectionTitle}>이번 달 남은 고정지출</Text>
                  <ChevronRight size={18} strokeWidth={iconStroke.default} color={tokens.ink3} />
                </Pressable>
                <Text className="mt-[8px] text-[20px] font-bold text-ink dark:text-ink-dark">
                  {formatAmountKo(upcoming.total)}
                </Text>
                <View className="mt-[12px] gap-[10px]">
                  {upcoming.items.slice(0, UPCOMING_PREVIEW).map(item => (
                    <View key={item.key} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-[10px]">
                        <View
                          className="rounded-[8px] px-[8px] py-[3px]"
                          style={{ backgroundColor: tokens.neutralTint }}>
                          <Text className="text-[12px] font-semibold text-ink-2 dark:text-ink-dark-2">
                            {`${item.day}일`}
                          </Text>
                        </View>
                        <Text className="text-[14px] text-ink dark:text-ink-dark">
                          {item.title}
                        </Text>
                      </View>
                      <Text className="text-[13.5px] font-semibold text-ink dark:text-ink-dark">
                        {formatAmountKo(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {/* ⑦ 최근 내역 — 제목만 두고 전체보기는 리스트 아래로 */}
            <View className="mb-[8px] mt-[18px]">
              <Text className={cx.sectionTitle}>최근 내역</Text>
            </View>

            <ListCard className="px-[14px]">
              {recent.map(row => (
                <TransactionRow
                  key={row.id}
                  transaction={row}
                  subtitle={`${getCategoryLabel(row.categoryId)} · ${
                    formatRelativeDay(row.occurredAt) === '오늘'
                      ? formatTimeKo(row.occurredAt)
                      : formatRelativeDay(row.occurredAt)
                  }`}
                  onPress={() => navigation.navigate('TransactionDetail', { id: row.id })}
                />
              ))}
            </ListCard>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이번 달 전체 내역 보기"
              onPress={() => navigation.navigate('Transactions', { month })}
              className="mt-[10px] items-center rounded-field border border-line bg-surface py-[12px] active:opacity-70 dark:border-line-dark dark:bg-surface-dark">
              <Text className="text-[13px] font-semibold text-ink-2 dark:text-ink-dark-2">
                전체 내역 보기
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Fab onPress={() => navigation.navigate('AddTransaction')} />
    </Screen>
  );
}

function HomeSkeleton() {
  return (
    // 스크린리더에는 이 컨테이너 하나만 "불러오는 중"으로 읽힌다 (조각은 Skeleton 내부에서 접근성 숨김 처리)
    <View accessibilityRole="progressbar" accessibilityLabel="불러오는 중">
      {/* ① 메인 카드 — 채워진 면이라 내부 조각을 흉내내지 않고 단색 블록 하나로 */}
      <Skeleton height={200} radius={18} />

      {/* ② 오늘 지출 행 */}
      <View className="mt-[14px]">
        <Skeleton height={66} radius={16} />
      </View>

      {/* ③ 수입 · 수지 두 칸 */}
      <View className="mt-[14px]">
        <SkeletonCard>
          <View className="flex-row">
            {[0, 1].map(index => (
              <View key={index} className="flex-1">
                <Skeleton width={40} height={11} />
                <View className="mt-[6px]">
                  <Skeleton width="70%" height={17} />
                </View>
              </View>
            ))}
          </View>
        </SkeletonCard>
      </View>

      {/* ④ 카테고리 3줄 */}
      <View className="mt-[14px]">
        <SkeletonCard>
          <Skeleton width={96} height={13} />
          <View className="mt-[6px]">
            {[0, 1, 2].map(index => (
              <SkeletonRow key={index} divider={false} />
            ))}
          </View>
        </SkeletonCard>
      </View>

      {/* ⑤ 사용 현황 — 요약 3칸 + 주간 막대 */}
      <View className="mt-[14px]">
        <SkeletonCard>
          <Skeleton width={104} height={13} />
          <View className="mt-[14px] flex-row">
            {[0, 1, 2].map(index => (
              <View key={index} className="flex-1">
                <Skeleton width={44} height={11} />
                <View className="mt-[6px]">
                  <Skeleton width="60%" height={16} />
                </View>
              </View>
            ))}
          </View>
          <View className="mt-[18px]">
            <Skeleton height={WEEK_BAR_HEIGHT} radius={8} />
          </View>
        </SkeletonCard>
      </View>

      {/* ⑦ 최근 내역 — 제목 + 3줄 + 전체보기 블록 */}
      <View className="mb-[8px] mt-[18px]">
        <Skeleton width={64} height={14} />
      </View>
      <ListCard className="px-[14px]">
        {[0, 1, 2].map(index => (
          <SkeletonRow key={index} divider={false} />
        ))}
      </ListCard>
      <View className="mt-[10px]">
        <Skeleton height={42} radius={12} />
      </View>
    </View>
  );
}
