import type { CategoryId, RecurringCycle, TransactionType } from '@hanpun/shared';
import { formatDateWithWeekday, getCategoryLabel, WEEKDAY_KO } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AmountInput,
  BottomSheet,
  Button,
  CategoryGrid,
  DateSheet,
  InputRow,
  MonthPickerSheet,
  NumberCell,
  Pill,
  Screen,
  ScreenHeader,
  SegmentedControl,
  SelectRow,
} from '../components';
import { usePersonalRules, useRememberCategory } from '../hooks/useClassification';
import { useCreateRecurringRule } from '../hooks/useRecurring';
import { useCreateTransaction } from '../hooks/useTransactions';
import { planCategoryMemory, suggestCategory } from '../lib/classify';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';

type Mode = 'once' | 'recurring';
/** date=1회성 날짜, anchor=반복 기준일, start/end=반복 시작·종료월 */
type Sheet = 'date' | 'anchor' | 'start' | 'end' | null;

const DEFAULT_CATEGORY: Record<TransactionType, CategoryId> = {
  expense: 'etc',
  income: 'incomeEtc',
};

const CYCLES: { value: RecurringCycle; label: string }[] = [
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
];

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

/** 거래 입력 — 1회성·반복을 한 화면에서 처리 (디자인 add-expense / add-income / add-recurring) */
export function AddTransactionScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => new Date(), []);

  const [type, setType] = useState<TransactionType>(route.params?.type ?? 'expense');
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'once');
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [occurredAt, setOccurredAt] = useState(
    () => (route.params?.date ? new Date(route.params.date) : new Date()),
  );
  const [categoryId, setCategoryId] = useState<CategoryId>(
    route.params?.categoryId ?? DEFAULT_CATEGORY[route.params?.type ?? 'expense'],
  );

  // 반복 모드 전용 상태 — 모드를 오가도 값은 유지된다
  const [cycle, setCycle] = useState<RecurringCycle>('monthly');
  const [dayAnchor, setDayAnchor] = useState(today.getDate());
  const [anchorMonth, setAnchorMonth] = useState(today.getMonth() + 1);
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [startMonth, setStartMonth] = useState(today.getMonth() + 1);
  const [end, setEnd] = useState<{ year: number; month: number } | null>(null);

  const [sheet, setSheet] = useState<Sheet>(null);

  /** 사용자가 카테고리를 직접 골랐으면 자동분류가 덮어쓰지 않는다 */
  const manual = useRef(Boolean(route.params?.categoryId));

  const { data: rules } = usePersonalRules();
  const create = useCreateTransaction();
  const createRecurring = useCreateRecurringRule();
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

  const changeCycle = (next: RecurringCycle) => {
    setCycle(next);
    // 주기가 바뀌면 기준일 의미가 달라지므로 기본값으로 되돌린다
    setDayAnchor(next === 'weekly' ? today.getDay() : today.getDate());
  };

  const anchorLabel =
    cycle === 'weekly'
      ? `매주 ${WEEKDAY_KO[dayAnchor] ?? '일'}요일`
      : cycle === 'monthly'
        ? `매월 ${dayAnchor}일`
        : `매년 ${anchorMonth}월 ${dayAnchor}일`;

  const pending = create.isPending || createRecurring.isPending;
  const canSave = amount > 0 && title.trim().length > 0 && !pending;

  const save = async () => {
    if (!canSave) {
      return;
    }
    const cleanTitle = title.trim();
    const cleanMemo = memo.trim() ? memo.trim() : null;

    if (mode === 'recurring') {
      try {
        await createRecurring.mutateAsync({
          type,
          amount,
          categoryId,
          title: cleanTitle,
          memo: cleanMemo,
          cycle,
          dayAnchor,
          month: cycle === 'yearly' ? anchorMonth : null,
          startsAt: new Date(startYear, startMonth - 1, 1).toISOString(),
          endsAt: end ? new Date(end.year, end.month, 0).toISOString() : null,
        });
      } catch {
        // 실패 알림은 전역 MutationCache 가 띄운다. 화면을 닫지 않고 입력값을 지킨다.
        return;
      }
    } else {
      try {
        await create.mutateAsync({
          type,
          amount,
          categoryId,
          title: cleanTitle,
          memo: cleanMemo,
          occurredAt: occurredAt.toISOString(),
        });
      } catch {
        return;
      }
    }

    // "탭해서 변경" 으로 자동분류를 고쳤으면 그 선택을 개인 규칙으로 기억한다
    const plan = planCategoryMemory({ title: cleanTitle, type, categoryId, rules: rules ?? [] });
    if (plan) {
      remember.mutate(plan);
    }
    navigation.goBack();
  };

  const showSuggestion = suggestion.source !== 'fallback' && title.trim().length > 0;
  const anchorFieldLabel = type === 'expense' ? '결제일' : '입금일';

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
              onChange={setMode}
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
            {mode === 'once' ? (
              <SelectRow
                label="날짜"
                value={formatDateWithWeekday(occurredAt.toISOString())}
                onPress={() => setSheet('date')}
              />
            ) : null}
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

          {mode === 'recurring' ? (
            <>
              <Text className="mb-[8px] mt-[16px] px-[2px] text-caption font-bold text-ink-2 dark:text-ink-dark-2">
                반복 주기
              </Text>
              <SegmentedControl options={CYCLES} value={cycle} onChange={changeCycle} />

              <View className="mt-[12px] gap-[10px]">
                <SelectRow
                  label={anchorFieldLabel}
                  value={anchorLabel}
                  onPress={() => setSheet('anchor')}
                />
                <SelectRow
                  label="시작"
                  value={`${startYear}. ${startMonth}월부터`}
                  onPress={() => setSheet('start')}
                />
                <SelectRow
                  label="종료"
                  placeholder="설정 안 함 (계속 반복)"
                  value={end ? `${end.year}. ${end.month}월까지` : undefined}
                  onPress={() => setSheet('end')}
                />
              </View>

              <Text className="mt-[10px] px-[2px] text-[12.5px] text-ink-2 dark:text-ink-dark-2">
                {anchorLabel}
              </Text>
            </>
          ) : null}
        </ScrollView>

        <View
          className="border-t border-line bg-page px-[20px] pt-[12px] dark:border-line-dark dark:bg-page-dark"
          style={{ paddingBottom: 14 + insets.bottom }}>
          <Button
            label={mode === 'recurring' ? '반복거래 등록' : '저장'}
            onPress={save}
            disabled={!canSave}
            loading={pending}
            style={
              type === 'income' && canSave ? { backgroundColor: tokens.good } : undefined
            }
          />
        </View>
      </KeyboardAvoidingView>

      <DateSheet
        visible={sheet === 'date'}
        value={occurredAt}
        onClose={() => setSheet(null)}
        onConfirm={date => {
          // 선택한 날짜에 현재 시각을 붙여 저장한다
          const next = new Date(date);
          next.setHours(occurredAt.getHours(), occurredAt.getMinutes(), 0, 0);
          setOccurredAt(next);
          setSheet(null);
        }}
      />

      <BottomSheet
        visible={sheet === 'anchor'}
        onClose={() => setSheet(null)}
        title={anchorFieldLabel}
        scrollable>
        {cycle === 'weekly' ? (
          <View className="flex-row flex-wrap gap-[8px] pb-[8px]">
            {WEEKDAY_KO.map((day, index) => (
              <Pill
                key={day}
                label={`${day}요일`}
                selected={dayAnchor === index}
                onPress={() => {
                  setDayAnchor(index);
                  setSheet(null);
                }}
              />
            ))}
          </View>
        ) : (
          <View className="pb-[8px]">
            {cycle === 'yearly' ? (
              <>
                <Text className="mb-[8px] text-caption font-bold text-ink-3 dark:text-ink-dark-3">
                  월
                </Text>
                <View className="mb-[16px] flex-row flex-wrap gap-[6px]">
                  {MONTHS.map(month => (
                    <NumberCell
                      key={month}
                      label={`${month}월`}
                      selected={anchorMonth === month}
                      onPress={() => setAnchorMonth(month)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <Text className="mb-[8px] text-caption font-bold text-ink-3 dark:text-ink-dark-3">
              일
            </Text>
            <View className="flex-row flex-wrap gap-[6px]">
              {DAYS.map(day => (
                <NumberCell
                  key={day}
                  label={String(day)}
                  selected={dayAnchor === day}
                  onPress={() => setDayAnchor(day)}
                />
              ))}
            </View>
            <View className="mt-[16px]">
              <Button label="확인" onPress={() => setSheet(null)} />
            </View>
          </View>
        )}
      </BottomSheet>

      <MonthPickerSheet
        visible={sheet === 'start'}
        title="시작 월"
        year={startYear}
        month={startMonth}
        onClose={() => setSheet(null)}
        onConfirm={(year, month) => {
          setStartYear(year);
          setStartMonth(month);
          setSheet(null);
        }}
      />

      <MonthPickerSheet
        visible={sheet === 'end'}
        title="종료 월"
        year={end?.year ?? startYear + 1}
        month={end?.month ?? startMonth}
        clearLabel="종료 없음"
        onClear={() => {
          setEnd(null);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
        onConfirm={(year, month) => {
          setEnd({ year, month });
          setSheet(null);
        }}
      />
    </Screen>
  );
}
