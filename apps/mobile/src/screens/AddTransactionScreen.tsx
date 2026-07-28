import type { CategoryId, TransactionType } from '@hanpun/shared';
import { formatDateWithWeekday, getCategoryLabel } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AmountInput,
  Button,
  CategoryGrid,
  DateSheet,
  InputRow,
  Screen,
  ScreenHeader,
  SegmentedControl,
  SelectRow,
} from '../components';
import { usePersonalRules, useRememberCategory } from '../hooks/useClassification';
import { useCreateTransaction } from '../hooks/useTransactions';
import { planCategoryMemory, suggestCategory } from '../lib/classify';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';

type Mode = 'once' | 'recurring';

const DEFAULT_CATEGORY: Record<TransactionType, CategoryId> = {
  expense: 'etc',
  income: 'incomeEtc',
};

/** 거래 입력 (디자인 add-expense / add-income) */
export function AddTransactionScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'expense');
  const [mode, setMode] = useState<Mode>('once');
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [occurredAt, setOccurredAt] = useState(
    () => (route.params?.date ? new Date(route.params.date) : new Date()),
  );
  const [categoryId, setCategoryId] = useState<CategoryId>(
    route.params?.categoryId ?? DEFAULT_CATEGORY[route.params?.type ?? 'expense'],
  );
  const [dateSheet, setDateSheet] = useState(false);

  /** 사용자가 카테고리를 직접 골랐으면 자동분류가 덮어쓰지 않는다 */
  const manual = useRef(Boolean(route.params?.categoryId));

  const { data: rules } = usePersonalRules();
  const create = useCreateTransaction();
  const remember = useRememberCategory();

  const suggestion = useMemo(
    () => suggestCategory(title, type, rules ?? []),
    [title, type, rules],
  );

  useEffect(() => {
    if (!manual.current) {
      setCategoryId(suggestion.categoryId);
    }
  }, [suggestion.categoryId]);

  const changeType = (next: TransactionType) => {
    if (next === type) {
      return;
    }
    setType(next);
    manual.current = false;
    setCategoryId(DEFAULT_CATEGORY[next]);
  };

  const changeMode = (next: Mode) => {
    if (next === 'recurring') {
      // 반복거래는 주기·시작일이 필요해 전용 화면으로 넘긴다
      navigation.replace('AddRecurring', {});
      return;
    }
    setMode(next);
  };

  const canSave = amount > 0 && title.trim().length > 0 && !create.isPending;

  const save = async () => {
    if (!canSave) {
      return;
    }
    const cleanTitle = title.trim();
    try {
      await create.mutateAsync({
        type,
        amount,
        categoryId,
        title: cleanTitle,
        memo: memo.trim() ? memo.trim() : null,
        occurredAt: occurredAt.toISOString(),
      });
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다. 화면을 닫지 않고 입력값을 지킨다.
      return;
    }

    // "탭해서 변경" 으로 자동분류를 고쳤으면 그 선택을 개인 규칙으로 기억한다
    const plan = planCategoryMemory({ title: cleanTitle, type, categoryId, rules: rules ?? [] });
    if (plan) {
      remember.mutate(plan);
    }
    navigation.goBack();
  };

  const showSuggestion = suggestion.source !== 'fallback' && title.trim().length > 0;

  return (
    <Screen>
      <ScreenHeader title="거래 입력" closeIcon onBack={navigation.goBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">
          <View className="mb-[10px] self-center" style={{ width: 200 }}>
            <SegmentedControl
              options={[
                { value: 'expense', label: '지출' },
                { value: 'income', label: '수입' },
              ]}
              value={type}
              onChange={changeType}
            />
          </View>

          <View className="mb-[14px]">
            <SegmentedControl
              options={[
                { value: 'once', label: '1회성' },
                { value: 'recurring', label: type === 'expense' ? '반복 (고정지출)' : '반복 (고정수입)' },
              ]}
              value={mode}
              onChange={changeMode}
            />
          </View>

          <AmountInput
            value={amount}
            onChange={setAmount}
            tone={type === 'income' ? 'income' : 'expense'}
          />

          <View className="mt-[10px] gap-[10px]">
            <InputRow
              label="내역"
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'expense' ? '어디에 썼나요?' : '어디서 들어왔나요?'}
              maxLength={40}
            />
            <SelectRow
              label="날짜"
              value={formatDateWithWeekday(occurredAt.toISOString())}
              onPress={() => setDateSheet(true)}
            />
          </View>

          <Text className="mb-[8px] mt-[16px] px-[2px] text-caption font-bold text-ink-2 dark:text-ink-dark-2">
            카테고리
          </Text>

          {showSuggestion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="자동 분류 결과 — 탭해서 변경"
              onPress={() => {
                manual.current = true;
              }}
              className="mb-[10px] rounded-chip border px-[13px] py-[9px]"
              style={{ backgroundColor: tokens.bannerBg, borderColor: tokens.bannerBorder }}>
              <Text className="text-[12.5px] text-ink-2 dark:text-ink-dark-2">
                {'✦ "'}
                <Text className="font-bold text-orange-600 dark:text-orange-400">
                  {title.trim()}
                </Text>
                {'" → '}
                <Text className="font-bold text-orange-600 dark:text-orange-400">
                  {getCategoryLabel(suggestion.categoryId)}
                </Text>
                {' 자동 분류 · 탭해서 변경'}
              </Text>
            </Pressable>
          ) : null}

          <CategoryGrid
            type={type}
            value={categoryId}
            onChange={next => {
              manual.current = true;
              setCategoryId(next);
            }}
          />

          <View className="mt-[12px]">
            <InputRow
              label="메모"
              value={memo}
              onChangeText={setMemo}
              placeholder="메모 입력 (선택)"
              maxLength={100}
            />
          </View>
        </ScrollView>

        <View
          className="border-t border-line bg-page px-[20px] pt-[12px] dark:border-line-dark dark:bg-page-dark"
          style={{ paddingBottom: 14 + insets.bottom }}>
          <Button
            label="저장"
            onPress={save}
            disabled={!canSave}
            loading={create.isPending}
            style={
              type === 'income' && canSave ? { backgroundColor: tokens.good } : undefined
            }
          />
        </View>
      </KeyboardAvoidingView>

      <DateSheet
        visible={dateSheet}
        value={occurredAt}
        onClose={() => setDateSheet(false)}
        onConfirm={date => {
          // 선택한 날짜에 현재 시각을 붙여 저장한다
          const next = new Date(date);
          next.setHours(occurredAt.getHours(), occurredAt.getMinutes(), 0, 0);
          setOccurredAt(next);
          setDateSheet(false);
        }}
      />
    </Screen>
  );
}
