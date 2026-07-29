import type { CategoryId, RecurringCycle, TransactionType } from '@hanpun/shared';
import { getCategory, WEEKDAY_KO } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { ChevronRight, SearchX, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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
  BottomSheet,
  Button,
  CategoryGrid,
  CategoryIcon,
  EmptyState,
  InputRow,
  MonthPickerSheet,
  NumberCell,
  Pill,
  Screen,
  ScreenHeader,
  SelectRow,
  SkeletonCard,
} from '../components';
import {
  useDeleteRecurringRule,
  useRecurringRules,
  useUpdateRecurringRule,
} from '../hooks/useRecurring';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';

const CYCLES: { value: RecurringCycle; label: string }[] = [
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' },
];

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

type Sheet = 'category' | 'anchor' | 'start' | 'end' | null;

/** 반복거래 **수정 전용** (디자인 add-recurring). 새로 만들 때는 AddTransaction 의 '반복' 탭. */
export function AddRecurringScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddRecurring'>>();
  const { tokens } = useTheme();
  const editingId = route.params.id;

  const { data: rules, isLoading, isError } = useRecurringRules();
  const update = useUpdateRecurringRule();
  const remove = useDeleteRecurringRule();

  const rule = useMemo(() => rules?.find(item => item.id === editingId), [rules, editingId]);

  const today = useMemo(() => new Date(), []);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('etc');
  const [cycle, setCycle] = useState<RecurringCycle>('monthly');
  const [dayAnchor, setDayAnchor] = useState(today.getDate());
  const [anchorMonth, setAnchorMonth] = useState(today.getMonth() + 1);
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [startMonth, setStartMonth] = useState(today.getMonth() + 1);
  const [end, setEnd] = useState<{ year: number; month: number } | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [ready, setReady] = useState(false);

  // 목록 캐시에서 원본을 찾아 폼을 한 번 채운다
  useEffect(() => {
    if (ready || !rule) {
      return;
    }
    const startsAt = new Date(rule.startsAt);
    setType(rule.type);
    setAmount(rule.amount);
    setTitle(rule.title);
    setCategoryId(rule.categoryId);
    setCycle(rule.cycle);
    setDayAnchor(rule.dayAnchor);
    setAnchorMonth(rule.month ?? startsAt.getMonth() + 1);
    setStartYear(startsAt.getFullYear());
    setStartMonth(startsAt.getMonth() + 1);
    if (rule.endsAt) {
      const endsAt = new Date(rule.endsAt);
      setEnd({ year: endsAt.getFullYear(), month: endsAt.getMonth() + 1 });
    }
    setReady(true);
  }, [ready, rule]);

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

  const canSave = amount > 0 && title.trim().length > 0 && !update.isPending;

  const save = async () => {
    if (!canSave) {
      return;
    }
    try {
      await update.mutateAsync({
        id: editingId,
        input: {
          type,
          amount,
          categoryId,
          title: title.trim(),
          cycle,
          dayAnchor,
          month: cycle === 'yearly' ? anchorMonth : null,
          startsAt: new Date(startYear, startMonth - 1, 1).toISOString(),
          endsAt: end ? new Date(end.year, end.month, 0).toISOString() : null,
        },
      });
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다. 화면을 닫지 않고 입력값을 지킨다.
      return;
    }
    navigation.goBack();
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(editingId);
    } catch {
      return;
    }
    navigation.goBack();
  };

  // 삭제된 규칙으로 진입하면 무한 스피너가 되므로 실패 상태를 따로 그린다
  if (isError || (!isLoading && !rule)) {
    return (
      <Screen>
        <ScreenHeader title="반복거래 수정" onBack={navigation.goBack} />
        <EmptyState
          icon={SearchX}
          title="반복거래를 불러올 수 없어요"
          description="이미 삭제된 규칙일 수 있어요"
          tone="neutral"
          paddingTop={80}
        />
      </Screen>
    );
  }

  if (isLoading || !rule) {
    return (
      <Screen>
        <ScreenHeader title="반복거래 수정" onBack={navigation.goBack} />
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <SkeletonCard height={220} />
        </View>
      </Screen>
    );
  }

  const category = getCategory(categoryId);

  return (
    <Screen>
      <ScreenHeader
        title="반복거래 수정"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="삭제"
            onPress={onDelete}
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
            tone={type === 'income' ? 'income' : 'expense'}
          />

          <View className="mt-[10px] gap-[10px]">
            <InputRow
              label="내역"
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'expense' ? '예) SKT 요금' : '예) 급여'}
              maxLength={40}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet('category')}
              className="flex-row items-center rounded-field border-[1.5px] border-line bg-surface px-[14px] py-[11px] active:opacity-70 dark:border-line-dark dark:bg-surface-dark">
              <Text className="w-[64px] text-[14px] text-ink-2 dark:text-ink-dark-2">카테고리</Text>
              <View className="flex-1 flex-row items-center gap-[8px]">
                <CategoryIcon categoryId={categoryId} size={26} iconSize={14} radius={8} />
                <Text className={cx.body}>{category.label}</Text>
              </View>
              <ChevronRight size={16} strokeWidth={1.9} color={tokens.ink3} />
            </Pressable>
          </View>

          <Text className="mb-[8px] mt-[16px] px-[2px] text-caption font-bold text-ink-2 dark:text-ink-dark-2">
            반복 주기
          </Text>
          <View className="flex-row gap-[8px]">
            {CYCLES.map(item => (
              <Pill
                key={item.value}
                label={item.label}
                selected={cycle === item.value}
                onPress={() => changeCycle(item.value)}
              />
            ))}
          </View>

          <View className="mt-[12px] gap-[10px]">
            <SelectRow
              label={type === 'expense' ? '결제일' : '입금일'}
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

          <View
            className="mt-[14px] rounded-chip border px-[14px] py-[10px]"
            style={{ backgroundColor: tokens.bannerBg, borderColor: tokens.bannerBorder }}>
            <Text
              className="text-[12.5px] text-ink-2 dark:text-ink-dark-2"
              style={{ lineHeight: 19 }}>
              ✦ {type === 'expense' ? '결제일' : '입금일'}마다 자동으로 기록돼요 · 짧은 달은 말일로
              처리
            </Text>
          </View>

          <View className="mb-[28px] mt-[20px]">
            <Button
              label="수정 완료"
              onPress={save}
              disabled={!canSave}
              loading={update.isPending}
              style={type === 'income' && canSave ? { backgroundColor: tokens.good } : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={sheet === 'category'}
        onClose={() => setSheet(null)}
        title="카테고리"
        scrollable>
        <View className="pb-[8px]">
          <CategoryGrid
            type={type}
            value={categoryId}
            onChange={next => {
              setCategoryId(next);
              setSheet(null);
            }}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'anchor'}
        onClose={() => setSheet(null)}
        title={type === 'expense' ? '결제일' : '입금일'}
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
