import type { RecurringRule } from '@hanpun/shared';
import { formatNumber, formatSignedAmount, toMonthKey, WEEKDAY_KO } from '@hanpun/shared';
import { Plus, Repeat } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  CategoryIcon,
  EmptyState,
  ListCard,
  Screen,
  ScreenHeader,
} from '../components';
import { useRecurringRules } from '../hooks/useRecurring';
import { useAppNavigation } from '../navigation/hooks';
import { useTheme } from '../theme/ThemeProvider';

/** 반복거래 관리 (디자인 recurring) */
export function RecurringScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();
  const { data } = useRecurringRules();
  const rules = (data ?? []).filter(rule => rule.active);

  const totals = useMemo(() => {
    const sum = (type: 'expense' | 'income') =>
      rules
        .filter(rule => rule.type === type)
        .reduce((acc, rule) => acc + monthlyEquivalent(rule), 0);
    return { expense: sum('expense'), income: sum('income') };
  }, [rules]);

  return (
    <Screen>
      <ScreenHeader
        title="반복거래 관리"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="반복거래 추가"
            onPress={() => navigation.navigate('AddRecurring', {})}
            hitSlop={8}>
            <Plus size={19} strokeWidth={2} color={tokens.ink3} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <Card padded={false} className="px-[16px] py-[16px]">
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-[11px] text-ink-3 dark:text-ink-dark-3">월 고정지출</Text>
              <Text className="mt-[4px] text-[18px] font-bold text-ink dark:text-ink-dark">
                {`-${formatNumber(totals.expense)}원`}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-ink-3 dark:text-ink-dark-3">월 고정수입</Text>
              <Text className="mt-[4px] text-[18px] font-bold" style={{ color: tokens.good }}>
                {`+${formatNumber(totals.income)}원`}
              </Text>
            </View>
          </View>
        </Card>

        {rules.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="등록된 반복거래가 없어요"
            description={'월세 · 통신비처럼 매달 나가는 항목을\n한 번만 등록해두면 자동으로 기록돼요'}
            paddingTop={50}
            footer={
              <Button
                label="반복거래 추가"
                size="sm"
                fullWidth={false}
                onPress={() => navigation.navigate('AddRecurring', {})}
              />
            }
          />
        ) : (
          <>
            <ListCard className="mt-[14px] px-[16px]">
              {rules.map(rule => (
                <Pressable
                  key={rule.id}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('AddRecurring', { id: rule.id })}
                  className="flex-row items-center gap-[12px] py-[13px] active:opacity-60">
                  <CategoryIcon categoryId={rule.categoryId} size={40} iconSize={19} radius={12} />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-[6px]">
                      <Text
                        numberOfLines={1}
                        className="text-[14.5px] font-semibold text-ink dark:text-ink-dark">
                        {rule.title}
                      </Text>
                      {rule.type === 'income' ? <Badge label="수입" tone="good" /> : null}
                    </View>
                    <Text className="mt-[2px] text-[12px] text-ink-2 dark:text-ink-dark-2">
                      {describeRule(rule)}
                    </Text>
                  </View>
                  <Text
                    className="text-[14.5px] font-semibold"
                    style={{
                      color: rule.type === 'income' ? tokens.good : tokens.ink,
                    }}>
                    {formatSignedAmount(rule.amount, rule.type)}
                  </Text>
                </Pressable>
              ))}
            </ListCard>

            <Text className="mt-[14px] text-center text-[12px] text-ink-3 dark:text-ink-dark-3">
              결제일이 되면 자동으로 기록돼요 · 항목을 탭하면 수정
            </Text>

            <View className="mt-[18px]">
              <Button
                label="반복거래 추가"
                onPress={() => navigation.navigate('AddRecurring', {})}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/** 주기가 달라도 '월 고정' 합계를 비교할 수 있도록 월 환산한다 */
function monthlyEquivalent(rule: RecurringRule): number {
  if (rule.cycle === 'weekly') {
    return Math.round((rule.amount * 52) / 12);
  }
  if (rule.cycle === 'yearly') {
    return Math.round(rule.amount / 12);
  }
  return rule.amount;
}

function describeRule(rule: RecurringRule): string {
  const cycleText =
    rule.cycle === 'weekly'
      ? `매주 ${WEEKDAY_KO[rule.dayAnchor] ?? '일'}요일`
      : rule.cycle === 'yearly'
        ? `매년 ${rule.month ?? 1}월 ${rule.dayAnchor}일`
        : `매월 ${rule.dayAnchor}일`;

  const parts = [cycleText];
  const startsAt = new Date(rule.startsAt);
  if (toMonthKey(startsAt) !== toMonthKey(new Date())) {
    parts.push(`${startsAt.getFullYear()}.${startsAt.getMonth() + 1}부터`);
  }
  if (rule.endsAt) {
    const endsAt = new Date(rule.endsAt);
    parts.push(`${endsAt.getFullYear()}.${endsAt.getMonth() + 1}까지`);
  }
  return parts.join(' · ');
}
