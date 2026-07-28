import type { CategoryId, RecurringCycle, TransactionType } from '@hanpun/shared';
import { getCategory, WEEKDAY_KO } from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
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
  InputRow,
  Pill,
  Screen,
  ScreenHeader,
  SegmentedControl,
  SelectRow,
} from '../components';
import {
  useCreateRecurringRule,
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

type Sheet = 'category' | 'anchor' | 'start' | 'end' | null;

/** 반복거래 등록·수정 (디자인 add-recurring) */
export function AddRecurringScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddRecurring'>>();
  const { tokens } = useTheme();
  const editingId = route.params?.id;

  const { data: rules } = useRecurringRules();
  const create = useCreateRecurringRule();
  const update = useUpdateRecurringRule();
  const remove = useDeleteRecurringRule();

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
  const [ready, setReady] = useState(!editingId);

  // 수정 모드: 목록 캐시에서 원본을 찾아 폼을 한 번 채운다
  useEffect(() => {
    if (ready || !editingId || !rules) {
      return;
    }
    const rule = rules.find(item => item.id === editingId);
    if (!rule) {
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
  }, [ready, editingId, rules]);

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

  const canSave = amount > 0 && title.trim().length > 0 && !create.isPending && !update.isPending;

  const save = async () => {
    if (!canSave) {
      return;
    }
    const input = {
      type,
      amount,
      categoryId,
      title: title.trim(),
      cycle,
      dayAnchor,
      month: cycle === 'yearly' ? anchorMonth : null,
      startsAt: new Date(startYear, startMonth - 1, 1).toISOString(),
      endsAt: end ? new Date(end.year, end.month, 0).toISOString() : null,
    };
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, input });
      } else {
        await create.mutateAsync(input);
      }
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다. 화면을 닫지 않고 입력값을 지킨다.
      return;
    }
    navigation.goBack();
  };

  const onDelete = async () => {
    if (!editingId) {
      return;
    }
    try {
      await remove.mutateAsync(editingId);
    } catch {
      return;
    }
    navigation.goBack();
  };

  const category = getCategory(categoryId);

  return (
    <Screen>
      <ScreenHeader
        title={editingId ? '반복거래 수정' : '거래 입력'}
        closeIcon={!editingId}
        onBack={navigation.goBack}
        right={
          editingId ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="삭제"
              onPress={onDelete}
              hitSlop={8}>
              <Trash2 size={19} strokeWidth={1.9} color={tokens.critical} />
            </Pressable>
          ) : null
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled">
          {editingId ? null : (
            <>
              <View className="mb-[10px] self-center" style={{ width: 200 }}>
                <SegmentedControl
                  options={[
                    { value: 'expense', label: '지출' },
                    { value: 'income', label: '수입' },
                  ]}
                  value={type}
                  onChange={next => {
                    setType(next);
                    setCategoryId(next === 'expense' ? 'etc' : 'incomeEtc');
                  }}
                />
              </View>
              <View className="mb-[14px]">
                <SegmentedControl
                  options={[
                    { value: 'once', label: '1회성' },
                    {
                      value: 'recurring',
                      label: type === 'expense' ? '반복 (고정지출)' : '반복 (고정수입)',
                    },
                  ]}
                  value="recurring"
                  onChange={next => {
                    if (next === 'once') {
                      navigation.replace('AddTransaction', { type });
                    }
                  }}
                />
              </View>
            </>
          )}

          <AmountInput
            value={amount}
            onChange={setAmount}
            autoFocus={!editingId}
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
              label={editingId ? '수정 완료' : '반복거래 등록'}
              onPress={save}
              disabled={!canSave}
              loading={create.isPending || update.isPending}
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
        clearLabel="설정 안 함 (계속 반복)"
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

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

function NumberCell({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-[38px] min-w-[44px] items-center justify-center rounded-[10px] border ${
        selected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/15'
          : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'
      }`}>
      <Text
        className={`text-caption ${
          selected
            ? 'font-bold text-orange-600 dark:text-orange-400'
            : 'text-ink-2 dark:text-ink-dark-2'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

interface MonthPickerProps {
  visible: boolean;
  title: string;
  year: number;
  month: number;
  clearLabel?: string;
  onClear?: () => void;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
}

/** 연 + 월만 고르는 시트 (반복거래 시작·종료) */
function MonthPickerSheet({
  visible,
  title,
  year,
  month,
  clearLabel,
  onClear,
  onClose,
  onConfirm,
}: MonthPickerProps) {
  const { tokens } = useTheme();
  const [draftYear, setDraftYear] = useState(year);
  const [draftMonth, setDraftMonth] = useState(month);

  useEffect(() => {
    if (visible) {
      setDraftYear(year);
      setDraftMonth(month);
    }
  }, [visible, year, month]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="mb-[14px] flex-row items-center justify-center gap-[16px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 해"
          onPress={() => setDraftYear(prev => prev - 1)}
          hitSlop={8}>
          <ChevronLeft size={18} strokeWidth={2} color={tokens.ink3} />
        </Pressable>
        <Text className="text-[16px] font-bold text-ink dark:text-ink-dark">{`${draftYear}년`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 해"
          onPress={() => setDraftYear(prev => prev + 1)}
          hitSlop={8}>
          <ChevronRight size={18} strokeWidth={2} color={tokens.ink3} />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-[6px]">
        {MONTHS.map(item => (
          <NumberCell
            key={item}
            label={`${item}월`}
            selected={draftMonth === item}
            onPress={() => setDraftMonth(item)}
          />
        ))}
      </View>

      <View className="mt-[16px] flex-row gap-[10px]">
        {clearLabel && onClear ? (
          <View className="flex-1">
            <Button label={clearLabel} variant="ghost" size="sm" onPress={onClear} />
          </View>
        ) : null}
        <View style={{ flex: clearLabel ? 1 : 1 }}>
          <Button label="확인" onPress={() => onConfirm(draftYear, draftMonth)} />
        </View>
      </View>
    </BottomSheet>
  );
}
