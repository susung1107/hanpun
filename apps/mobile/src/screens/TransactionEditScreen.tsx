import type { CategoryId } from '@hanpun/shared';
import { formatDateWithWeekday, formatSignedAmount, formatTimeKo } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { SearchX, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  AmountInput,
  Button,
  CategoryGrid,
  ConfirmDialog,
  DateSheet,
  EmptyState,
  InputRow,
  Screen,
  ScreenHeader,
  SelectRow,
  Skeleton,
} from '../components';
import { usePersonalRules, useRememberCategory } from '../hooks/useClassification';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { planCategoryMemory } from '../lib/classify';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';

/** 거래 수정 (디자인 transaction-edit) */
export function TransactionEditScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionEdit'>>();
  const { tokens } = useTheme();
  const { id } = route.params;

  const { data: transaction, isLoading, isError, error } = useTransaction(id);
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const { data: rules } = usePersonalRules();
  const remember = useRememberCategory();

  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('etc');
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [dateSheet, setDateSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ready, setReady] = useState(false);

  // 서버에서 원본이 도착하면 폼을 한 번만 초기화한다
  useEffect(() => {
    if (transaction && !ready) {
      setAmount(transaction.amount);
      setTitle(transaction.title);
      setMemo(transaction.memo ?? '');
      setCategoryId(transaction.categoryId);
      setOccurredAt(new Date(transaction.occurredAt));
      setReady(true);
    }
  }, [transaction, ready]);

  // 삭제된 거래로 들어오면 무한 스피너가 되므로 실패 상태를 따로 그린다
  if (isError || (!isLoading && !transaction)) {
    return (
      <Screen>
        <ScreenHeader title="거래 수정" onBack={navigation.goBack} />
        <EmptyState
          icon={SearchX}
          title="내역을 불러올 수 없어요"
          description={
            error instanceof Error ? error.message : '이미 삭제된 내역일 수 있어요'
          }
          tone="neutral"
          paddingTop={80}
        />
      </Screen>
    );
  }

  if (isLoading || !transaction) {
    return (
      <Screen>
        <ScreenHeader title="거래 수정" onBack={navigation.goBack} />
        <EditSkeleton />
      </Screen>
    );
  }

  const canSave = amount > 0 && title.trim().length > 0 && !update.isPending;

  const save = async () => {
    if (!canSave) {
      return;
    }
    const cleanTitle = title.trim();
    const changedCategory = categoryId !== transaction.categoryId;
    try {
      await update.mutateAsync({
        id: transaction.id,
        input: {
          type: transaction.type,
          amount,
          categoryId,
          title: cleanTitle,
          memo: memo.trim() ? memo.trim() : null,
          occurredAt: occurredAt.toISOString(),
        },
      });
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다
      return;
    }

    // 화면에서 "다음부터 새 카테고리로 자동 분류돼요" 라고 약속했으므로 규칙으로 남긴다
    if (changedCategory) {
      const plan = planCategoryMemory({
        title: cleanTitle,
        type: transaction.type,
        categoryId,
        rules: rules ?? [],
      });
      if (plan) {
        remember.mutate(plan);
      }
    }
    navigation.goBack();
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(transaction.id);
    } catch {
      setConfirming(false);
      return;
    }
    setConfirming(false);
    // 상세 → 수정 순서로 쌓여 있으므로 목록까지 두 단계 되돌린다
    navigation.pop(2);
  };

  const categoryChanged = categoryId !== transaction.categoryId;

  return (
    <Screen>
      <ScreenHeader
        title="거래 수정"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="삭제"
            onPress={() => setConfirming(true)}
            hitSlop={8}>
            <Trash2 size={19} strokeWidth={1.9} color={tokens.critical} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled">
          <AmountInput
            value={amount}
            onChange={setAmount}
            autoFocus={false}
            tone={transaction.type === 'income' ? 'income' : 'expense'}
          />

          <View className="mt-[10px] gap-[10px]">
            <InputRow label="내역" value={title} onChangeText={setTitle} maxLength={40} />
            <SelectRow
              label="날짜"
              value={`${formatDateWithWeekday(occurredAt.toISOString())} ${formatTimeKo(
                occurredAt.toISOString(),
              )}`}
              onPress={() => setDateSheet(true)}
            />
          </View>

          <Text className="mb-[8px] mt-[16px] px-[2px] text-caption font-bold text-ink-2 dark:text-ink-dark-2">
            카테고리
          </Text>
          <CategoryGrid type={transaction.type} value={categoryId} onChange={setCategoryId} />

          <View className="mt-[12px]">
            <InputRow
              label="메모"
              value={memo}
              onChangeText={setMemo}
              placeholder="메모 입력 (선택)"
              maxLength={100}
            />
          </View>

          {categoryChanged ? (
            <View
              className="mt-[12px] rounded-chip border px-[14px] py-[10px]"
              style={{ backgroundColor: tokens.bannerBg, borderColor: tokens.bannerBorder }}>
              <Text
                className="text-[12.5px] text-ink-2 dark:text-ink-dark-2"
                style={{ lineHeight: 19 }}>
                {`✦ 카테고리를 바꾸면 다음 "${transaction.title}" 부터 새 카테고리로 자동 분류돼요`}
              </Text>
            </View>
          ) : null}

          <View className="mb-[28px] mt-[20px] flex-row gap-[10px]">
            <View className="flex-1">
              <Button label="취소" variant="ghost" onPress={navigation.goBack} />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label="수정 완료"
                onPress={save}
                disabled={!canSave}
                loading={update.isPending}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateSheet
        visible={dateSheet}
        value={occurredAt}
        onClose={() => setDateSheet(false)}
        onConfirm={date => {
          const next = new Date(date);
          next.setHours(occurredAt.getHours(), occurredAt.getMinutes(), 0, 0);
          setOccurredAt(next);
          setDateSheet(false);
        }}
      />

      <ConfirmDialog
        visible={confirming}
        onClose={() => setConfirming(false)}
        icon={Trash2}
        tone="danger"
        title="이 내역을 삭제할까요?"
        message={`${transaction.title} ${formatSignedAmount(
          transaction.amount,
          transaction.type,
        )}\n삭제한 내역은 되돌릴 수 없어요`}
        confirmLabel="삭제"
        onConfirm={onDelete}
        loading={remove.isPending}
      />
    </Screen>
  );
}

/** 로딩 중 수정 폼 골격 — 금액 · 입력 행 · 카테고리 그리드 · 버튼 */
function EditSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
      style={{ paddingHorizontal: 20 }}>
      {/* 금액 입력 자리 */}
      <Skeleton height={56} radius={14} />

      {/* 내역 · 날짜 입력 행 */}
      <View className="mt-[10px] gap-[10px]">
        <Skeleton height={48} radius={12} />
        <Skeleton height={48} radius={12} />
      </View>

      {/* 카테고리 라벨 + 그리드 (5열 × 2행) */}
      <Skeleton width={44} height={12} style={{ marginTop: 16, marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: 10 }, (_, index) => (
          <View key={index} style={{ width: '20%' }}>
            <View style={{ paddingRight: 8 }}>
              <Skeleton height={64} radius={14} />
            </View>
          </View>
        ))}
      </View>

      {/* 메모 입력 행 */}
      <View className="mt-[12px]">
        <Skeleton height={48} radius={12} />
      </View>

      {/* 하단 버튼 (취소 · 수정 완료) */}
      <View className="mb-[28px] mt-[20px] flex-row gap-[10px]">
        <View className="flex-1">
          <Skeleton height={50} radius={14} />
        </View>
        <View style={{ flex: 2 }}>
          <Skeleton height={50} radius={14} />
        </View>
      </View>
    </View>
  );
}
