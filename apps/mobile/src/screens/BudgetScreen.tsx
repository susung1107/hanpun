import type { ExpenseCategoryId } from '@hanpun/shared';
import {
  EXPENSE_CATEGORIES,
  formatMonthShort,
  formatNumber,
  getCategory,
} from '@hanpun/shared';
import { Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  AmountInput,
  BottomSheet,
  Button,
  CategoryIcon,
  ListCard,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionLabel,
  Skeleton,
  SkeletonCard,
} from '../components';
import { useBudgetProgress, useBudgets, useDeleteBudget, useUpsertBudget } from '../hooks/useBudgets';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import { useAppNavigation } from '../navigation/hooks';
import { useTheme } from '../theme/ThemeProvider';

/** 예산 설정 (디자인 budget) */
export function BudgetScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();
  const { month } = useMonthNavigation();

  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month);
  const { data: progress } = useBudgetProgress(month);
  const upsert = useUpsertBudget();
  const remove = useDeleteBudget();

  const [total, setTotal] = useState(0);
  const [drafts, setDrafts] = useState<Partial<Record<ExpenseCategoryId, number>>>({});
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategoryId | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  // 서버 예산이 도착하면 폼을 한 번 초기화한다
  useEffect(() => {
    if (!budgets || ready) {
      return;
    }
    const next: Partial<Record<ExpenseCategoryId, number>> = {};
    budgets.forEach(budget => {
      if (budget.categoryId === null) {
        setTotal(budget.amount);
      } else {
        next[budget.categoryId] = budget.amount;
      }
    });
    setDrafts(next);
    setReady(true);
  }, [budgets, ready]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (progress ?? []).forEach(item => {
      if (item.categoryId) {
        map.set(item.categoryId, item.spentAmount);
      }
    });
    return map;
  }, [progress]);

  const rows = useMemo(
    () =>
      EXPENSE_CATEGORIES.filter(category => drafts[category.id as ExpenseCategoryId] !== undefined),
    [drafts],
  );

  const available = useMemo(
    () => EXPENSE_CATEGORIES.filter(category => drafts[category.id as ExpenseCategoryId] === undefined),
    [drafts],
  );

  const save = async () => {
    setSaving(true);
    try {
      await upsert.mutateAsync({ month, categoryId: null, amount: total });

      await Promise.all(
        rows.map(category =>
          upsert.mutateAsync({
            month,
            categoryId: category.id as ExpenseCategoryId,
            amount: drafts[category.id as ExpenseCategoryId] ?? 0,
          }),
        ),
      );

      // 화면에서 지운 카테고리 예산은 서버에서도 삭제한다
      const removed = (budgets ?? []).filter(
        budget => budget.categoryId !== null && drafts[budget.categoryId] === undefined,
      );
      await Promise.all(removed.map(budget => remove.mutateAsync(budget.id)));

      navigation.goBack();
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다. 화면을 닫지 않고 입력값을 지킨다.
      // (catch 가 없으면 저장에 실패해도 뒤로 가버려 성공한 것처럼 보인다)
    } finally {
      setSaving(false);
    }
  };

  // 서버 예산이 도착하기 전에는 총예산·카테고리 골격을 그린다
  if (budgetsLoading) {
    return (
      <Screen>
        <ScreenHeader title="예산 설정" onBack={navigation.goBack} />
        <BudgetSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="예산 설정" onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        <AmountInput
          value={total}
          onChange={setTotal}
          label={`${formatMonthShort(month)} 전체 예산`}
          autoFocus={false}
        />

        <SectionLabel title="카테고리별 예산" hint="· 선택" />

        <ListCard className="px-[16px]">
          {rows.map(category => {
            const budget = drafts[category.id as ExpenseCategoryId] ?? 0;
            const spent = spentByCategory.get(category.id) ?? 0;
            const ratio = budget > 0 ? spent / budget : 0;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                onPress={() => setEditing(category.id as ExpenseCategoryId)}
                className="flex-row items-center gap-[12px] py-[13px] active:opacity-60">
                <CategoryIcon categoryId={category.id} size={34} iconSize={17} radius={10} />
                <View className="flex-1">
                  <Text className="text-[13.5px] font-semibold text-ink dark:text-ink-dark">
                    {category.label}
                  </Text>
                  <View className="mt-[6px]">
                    <ProgressBar ratio={ratio} height={6} />
                  </View>
                </View>
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: ratio > 1 ? tokens.critical : tokens.ink }}>
                  {formatNumber(spent)}
                  <Text className="font-normal" style={{ color: tokens.ink3 }}>
                    {` / ${formatNumber(budget)}`}
                  </Text>
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            onPress={() => setPicking(true)}
            disabled={available.length === 0}
            className="items-center py-[14px] active:opacity-60">
            <Text
              className="text-caption font-semibold"
              style={{ color: available.length === 0 ? tokens.ink3 : tokens.accentText }}>
              {available.length === 0 ? '모든 카테고리에 예산이 있어요' : '+ 카테고리 예산 추가'}
            </Text>
          </Pressable>
        </ListCard>

        <Text className="mt-[14px] text-center text-[12px] text-ink-3 dark:text-ink-dark-3">
          80% · 100% 도달 시 알림을 보내드려요
        </Text>

        <View className="mt-[18px]">
          <Button label="저장" onPress={save} loading={saving} disabled={saving} />
        </View>
      </ScrollView>

      <BottomSheet visible={picking} onClose={() => setPicking(false)} title="카테고리 선택" scrollable>
        <View className="pb-[8px]">
          {available.map(category => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              onPress={() => {
                setDrafts(prev => ({ ...prev, [category.id]: 0 }));
                setPicking(false);
                setEditing(category.id as ExpenseCategoryId);
              }}
              className="flex-row items-center gap-[12px] border-b border-line py-[13px] active:opacity-60 dark:border-line-dark">
              <CategoryIcon categoryId={category.id} size={34} iconSize={17} radius={10} />
              <Text className="flex-1 text-body font-semibold text-ink dark:text-ink-dark">
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <CategoryBudgetSheet
        categoryId={editing}
        value={editing ? (drafts[editing] ?? 0) : 0}
        onClose={() => setEditing(null)}
        onRemove={() => {
          if (editing) {
            setDrafts(prev => {
              const next = { ...prev };
              delete next[editing];
              return next;
            });
          }
          setEditing(null);
        }}
        onConfirm={amount => {
          if (editing) {
            setDrafts(prev => ({ ...prev, [editing]: amount }));
          }
          setEditing(null);
        }}
      />
    </Screen>
  );
}

/** 예산 화면 로딩 골격 — 총예산 카드 + 카테고리별 예산 6줄 */
function BudgetSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
      style={{ paddingHorizontal: 18, paddingTop: 8 }}>
      <SkeletonCard>
        <Skeleton width="40%" height={12} />
        <Skeleton width="55%" height={26} style={{ marginTop: 12 }} />
        <Skeleton height={6} style={{ marginTop: 14 }} />
      </SkeletonCard>

      <Skeleton width="35%" height={13} style={{ marginTop: 22, marginBottom: 12 }} />

      <SkeletonCard>
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} className="flex-row items-center gap-[12px] py-[13px]">
            <Skeleton width={34} height={34} radius={10} />
            <View className="flex-1 gap-[7px]">
              <Skeleton width="45%" height={13} />
              <Skeleton height={6} />
            </View>
            <Skeleton width={64} height={12} />
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

interface SheetProps {
  categoryId: ExpenseCategoryId | null;
  value: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  onRemove: () => void;
}

/** 카테고리 예산 금액 입력 시트 */
function CategoryBudgetSheet({ categoryId, value, onClose, onConfirm, onRemove }: SheetProps) {
  const { tokens } = useTheme();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (categoryId) {
      setDraft(value);
    }
  }, [categoryId, value]);

  return (
    <BottomSheet
      visible={categoryId !== null}
      onClose={onClose}
      title={categoryId ? `${getCategory(categoryId).label} 예산` : undefined}>
      <View className="pb-[4px]">
        <AmountInput value={draft} onChange={setDraft} label="월 예산" />
        <View className="mt-[16px] flex-row items-center gap-[10px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="예산 삭제"
            onPress={onRemove}
            className="h-[48px] w-[48px] items-center justify-center rounded-[12px] border border-line active:opacity-60 dark:border-line-dark">
            <Trash2 size={19} strokeWidth={1.9} color={tokens.critical} />
          </Pressable>
          <View className="flex-1">
            <Button label="확인" onPress={() => onConfirm(draft)} disabled={draft <= 0} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
