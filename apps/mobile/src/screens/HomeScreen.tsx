import {
  describeMonthOverMonth,
  formatAmountKo,
  formatNumber,
  formatRelativeDay,
  formatTimeKo,
  formatWon,
  getCategoryLabel,
  toDateKey,
  toMonthKey,
} from '@hanpun/shared';
import { Bell, Receipt } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  Fab,
  ListCard,
  ProgressBar,
  Screen,
  Skeleton,
  SkeletonCard,
  SkeletonRow,
  TransactionRow,
} from '../components';
import { useBudgetProgress } from '../hooks/useBudgets';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { useMonthlyStats } from '../hooks/useStats';
import { useMonthTransactions } from '../hooks/useTransactions';
import { syncReminder } from '../lib/reminder';
import { useAppNavigation } from '../navigation/hooks';
import { useSettingsStore } from '../store/settingsStore';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';
import { iconStroke, palette } from '../theme/tokens';

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
        <Card large>
          <Text className="text-[12px] text-ink-3 dark:text-ink-dark-3">이번 달 총 지출</Text>
          <Text className="mt-[4px] text-[32px] font-bold text-ink dark:text-ink-dark">
            {formatWon(totalExpense)}
          </Text>

          {isEmpty ? (
            <Text className="mt-[6px] text-[12.5px] text-ink-3 dark:text-ink-dark-3">
              예산을 설정하면 진행률이 여기 표시돼요
            </Text>
          ) : (
            <>
              <Text
                className="mt-[4px] text-caption font-semibold"
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

              <View className="mt-[12px] flex-row gap-[18px]">
                <Text className={cx.caption}>
                  수입{' '}
                  <Text style={{ color: tokens.good, fontWeight: '600' }}>
                    {`+${formatNumber(totalIncome)}`}
                  </Text>
                </Text>
                <Text className={cx.caption}>
                  수지{' '}
                  <Text className="font-semibold text-ink dark:text-ink-dark">
                    {`${balance >= 0 ? '+' : '-'}${formatNumber(Math.abs(balance))}`}
                  </Text>
                </Text>
              </View>

              {totalBudget ? (
                <>
                  <View className="mt-[14px]">
                    <ProgressBar ratio={budgetRatio} />
                  </View>
                  <View className="mt-[8px] flex-row justify-between">
                    <Text className="text-[12px] text-ink-2 dark:text-ink-dark-2">
                      {`예산 ${formatNumber(totalBudget.budgetAmount)}원 중 ${Math.round(
                        budgetRatio * 100,
                      )}%`}
                    </Text>
                    <Text className="text-[12px] text-ink-2 dark:text-ink-dark-2">
                      {remaining >= 0
                        ? `잔여 ${formatNumber(remaining)}원`
                        : `초과 ${formatNumber(-remaining)}원`}
                    </Text>
                  </View>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Budget')}
                  className="mt-[12px] active:opacity-70">
                  <Text className="text-[12.5px] font-semibold text-orange-600 dark:text-orange-400">
                    예산 설정하기 ›
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Card>

        {isEmpty ? (
          <EmptyState
            icon={Receipt}
            title="아직 기록이 없어요"
            description={'오른쪽 아래 + 버튼을 눌러\n오늘 첫 지출을 기록해보세요'}
          />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('AddTransaction')}
              className="mt-[14px] rounded-field border bg-orange-50 px-[16px] py-[12px] active:opacity-80 dark:bg-orange-500/10"
              style={{ borderColor: isDark ? palette.orangeBorderDark : palette.orange100 }}>
              <Text className="text-[13.5px] text-ink-2 dark:text-ink-dark-2">오늘 지출</Text>
              <Text className="mt-[2px] text-body font-semibold text-orange-600 dark:text-orange-400">
                {today.count > 0
                  ? `${formatAmountKo(today.expense)} · ${today.count}건`
                  : '아직 없어요 · 탭해서 기록하기'}
              </Text>
            </Pressable>

            <View className="mb-[8px] mt-[18px] flex-row items-center justify-between">
              <Text className={cx.sectionTitle}>최근 내역</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Transactions', { month })}
                hitSlop={6}>
                <Text className="text-[12px] text-ink-3 dark:text-ink-dark-3">전체보기 ›</Text>
              </Pressable>
            </View>

            <ListCard className="px-[14px]">
              {recent.map(row => (
                <TransactionRow
                  key={row.id}
                  transaction={row}
                  subtitle={`${getCategoryLabel(row.categoryId)} · ${formatRelativeDay(
                    row.occurredAt,
                  ) === '오늘'
                    ? formatTimeKo(row.occurredAt)
                    : formatRelativeDay(row.occurredAt)}`}
                  onPress={() => navigation.navigate('TransactionDetail', { id: row.id })}
                />
              ))}
            </ListCard>
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
      {/* 요약 카드 — Card large 와 같은 radius 18 */}
      <SkeletonCard>
        {/* '이번 달 총 지출' 라벨 → 32px 대형 금액 → 전월 대비 한 줄 */}
        <Skeleton width={84} height={11} />
        <View className="mt-[8px]">
          <Skeleton width="62%" height={30} radius={8} />
        </View>
        <View className="mt-[10px]">
          <Skeleton width="46%" height={12} />
        </View>

        {/* 수입 · 수지 두 칸 */}
        <View className="mt-[14px] flex-row gap-[18px]">
          <Skeleton width={92} height={12} />
          <Skeleton width={92} height={12} />
        </View>

        {/* 예산 진행바 — ProgressBar 기본 height 8 / radius 4 와 같은 크기 */}
        <View className="mt-[14px]">
          <Skeleton height={8} radius={4} />
        </View>
        <View className="mt-[8px] flex-row justify-between">
          <Skeleton width={116} height={11} />
          <Skeleton width={78} height={11} />
        </View>
      </SkeletonCard>

      {/* '오늘 지출' 배너 — 라벨 + 금액 2줄이라 실제 높이가 약 62 */}
      <View className="mt-[14px]">
        <Skeleton height={62} radius={14} />
      </View>

      {/* '최근 내역' 제목 + '전체보기 ›' */}
      <View className="mb-[8px] mt-[18px] flex-row items-center justify-between">
        <Skeleton width={64} height={14} />
        <Skeleton width={52} height={11} />
      </View>

      {/* 홈은 최근 3건만 보여주므로 스켈레톤도 정확히 3줄 (구분선은 ListCard 가 넣는다) */}
      <ListCard className="px-[14px]">
        {[0, 1, 2].map(index => (
          <SkeletonRow key={index} divider={false} />
        ))}
      </ListCard>
    </View>
  );
}
