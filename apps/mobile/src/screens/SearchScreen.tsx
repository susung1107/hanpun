import type { CategoryId, Transaction, TransactionType } from '@hanpun/shared';
import {
  formatNumber,
  formatTimeKo,
  getCategoriesByType,
  getCategoryLabel,
  toMonthKey,
  WEEKDAY_KO,
} from '@hanpun/shared';
import { Search, SearchX, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  BottomSheet,
  CategoryIcon,
  EmptyState,
  ListCard,
  Pill,
  Screen,
  Skeleton,
  SkeletonList,
  TransactionRow,
} from '../components';
import { useTransactionSearch } from '../hooks/useTransactions';
import { MERCHANT_DICTIONARY } from '../lib/merchantDictionary';
import { useAppNavigation } from '../navigation/hooks';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

type Period = 3 | 12 | 0;
type TypeFilter = 'all' | TransactionType;
type Sheet = 'period' | 'category' | null;

const PERIODS: { value: Period; label: string }[] = [
  { value: 3, label: '최근 3개월' },
  { value: 12, label: '최근 1년' },
  { value: 0, label: '전체 기간' },
];

const TYPE_ORDER: TypeFilter[] = ['all', 'expense', 'income'];
const TYPE_LABEL: Record<TypeFilter, string> = {
  all: '전체',
  expense: '지출만',
  income: '수입만',
};

/** 검색 (디자인 search / empty-search) */
export function SearchScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();

  const [keyword, setKeyword] = useState('');
  const [period, setPeriod] = useState<Period>(3);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

  // searched = 실제로 서버에 던진(디바운스된) 키워드. 입력 중에는 trimmed 와 다르다.
  const { data, isFetching, keyword: searched } = useTransactionSearch(keyword);

  const results = useMemo(() => {
    const rows = data ?? [];
    const limit = new Date();
    if (period > 0) {
      limit.setMonth(limit.getMonth() - period);
    }
    return rows.filter(row => {
      if (typeFilter !== 'all' && row.type !== typeFilter) {
        return false;
      }
      if (categoryId && row.categoryId !== categoryId) {
        return false;
      }
      if (period > 0 && new Date(row.occurredAt) < limit) {
        return false;
      }
      return true;
    });
  }, [data, period, typeFilter, categoryId]);

  const sum = useMemo(
    () =>
      results.reduce(
        (acc, row) => acc + (row.type === 'expense' ? -row.amount : row.amount),
        0,
      ),
    [results],
  );

  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    results.forEach(row => {
      const key = toMonthKey(new Date(row.occurredAt));
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [results]);

  const trimmed = keyword.trim();
  const settled = searched === trimmed;
  const didYouMean = useMemo(
    () => (trimmed.length >= 2 && results.length === 0 ? findSimilarMerchant(trimmed) : null),
    [trimmed, results.length],
  );

  const periodLabel = PERIODS.find(item => item.value === period)?.label ?? '최근 3개월';

  return (
    <Screen>
      <View className="flex-row items-center gap-[8px] px-[20px] pb-[10px] pt-[6px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={navigation.goBack}
          hitSlop={8}
          className="h-[36px] w-[28px] items-center justify-start">
          <Text style={{ fontSize: 24, lineHeight: 30, color: tokens.ink }}>‹</Text>
        </Pressable>

        <View
          className="flex-1 flex-row items-center gap-[8px] rounded-chip border-[1.5px] bg-surface px-[12px] py-[9px] dark:bg-surface-dark"
          style={{ borderColor: palette.orange500 }}>
          <Search size={16} strokeWidth={1.9} color={tokens.ink3} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="상호명 · 메모 검색"
            placeholderTextColor={tokens.ink3}
            autoFocus
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: tokens.ink, padding: 0 }}
          />
          {keyword.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="지우기"
              onPress={() => setKeyword('')}
              hitSlop={8}>
              <X size={15} strokeWidth={2} color={tokens.ink3} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mb-[10px] flex-row gap-[8px] px-[20px]">
        <Pill label={`${periodLabel} ▾`} size="sm" onPress={() => setSheet('period')} />
        <Pill
          label={categoryId ? getCategoryLabel(categoryId) : '카테고리 ▾'}
          size="sm"
          selected={categoryId !== null}
          onPress={() => setSheet('category')}
        />
        <Pill
          label={TYPE_LABEL[typeFilter]}
          size="sm"
          selected={typeFilter !== 'all'}
          onPress={() =>
            setTypeFilter(prev => TYPE_ORDER[(TYPE_ORDER.indexOf(prev) + 1) % TYPE_ORDER.length] ?? 'all')
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        {trimmed.length === 0 ? (
          <EmptyState
            icon={Search}
            title="무엇을 찾고 있나요?"
            description={'상호명이나 메모를 입력하면\n지난 기록에서 찾아드려요'}
            tone="neutral"
            paddingTop={90}
          />
        ) : trimmed.length < 2 ? (
          <EmptyState
            icon={Search}
            title="두 글자 이상 입력해 주세요"
            description={'한 글자만으로는 결과가 너무 많아\n두 글자부터 찾아드려요'}
            tone="neutral"
            paddingTop={90}
          />
        ) : (isFetching || !settled) && results.length === 0 ? (
          <SearchSkeleton />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`"${searched}" 검색 결과가 없어요`}
            description={'맞춤법을 확인하거나\n다른 검색어로 시도해보세요'}
            tone="neutral"
            paddingTop={90}
            footer={
              didYouMean ? (
                <Pill
                  label={`혹시 "${didYouMean}" 를 찾으셨나요?`}
                  selected
                  onPress={() => setKeyword(didYouMean)}
                />
              ) : undefined
            }
          />
        ) : (
          <>
            <Text className="mb-[4px] text-[12.5px] text-ink-2 dark:text-ink-dark-2">
              검색 결과{' '}
              <Text className="font-bold text-ink dark:text-ink-dark">{`${results.length}건`}</Text>
              {' · 합계 '}
              <Text className="font-bold text-ink dark:text-ink-dark">
                {`${sum >= 0 ? '+' : '-'}${formatNumber(Math.abs(sum))}원`}
              </Text>
            </Text>

            {sections.map(([monthKey, rows]) => (
              <View key={monthKey} className="mt-[10px]">
                <Text className="mb-[6px] px-[4px] text-[12px] font-bold text-ink-3 dark:text-ink-dark-3">
                  {`${Number(monthKey.split('-')[1])}월`}
                </Text>
                <ListCard className="px-[16px]">
                  {rows.map(row => (
                    <TransactionRow
                      key={row.id}
                      transaction={row}
                      subtitle={formatRowDate(row.occurredAt)}
                      onPress={() => navigation.navigate('TransactionDetail', { id: row.id })}
                    />
                  ))}
                </ListCard>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <BottomSheet visible={sheet === 'period'} onClose={() => setSheet(null)} title="기간">
        <View className="pb-[6px]">
          {PERIODS.map(item => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: period === item.value }}
              onPress={() => {
                setPeriod(item.value);
                setSheet(null);
              }}
              className="border-b border-line py-[14px] active:opacity-60 dark:border-line-dark">
              <Text
                className={`text-body ${
                  period === item.value
                    ? 'font-bold text-orange-600 dark:text-orange-400'
                    : 'text-ink dark:text-ink-dark'
                }`}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'category'}
        onClose={() => setSheet(null)}
        title="카테고리"
        scrollable>
        <View className="pb-[8px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCategoryId(null);
              setSheet(null);
            }}
            className="border-b border-line py-[14px] active:opacity-60 dark:border-line-dark">
            <Text
              className={`text-body ${
                categoryId === null
                  ? 'font-bold text-orange-600 dark:text-orange-400'
                  : 'text-ink dark:text-ink-dark'
              }`}>
              전체 카테고리
            </Text>
          </Pressable>
          {[...getCategoriesByType('expense'), ...getCategoriesByType('income')].map(category => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              onPress={() => {
                setCategoryId(category.id);
                setSheet(null);
              }}
              className="flex-row items-center gap-[12px] border-b border-line py-[12px] active:opacity-60 dark:border-line-dark">
              <CategoryIcon categoryId={category.id} size={32} iconSize={16} radius={10} />
              <Text
                className={`flex-1 text-body ${
                  categoryId === category.id
                    ? 'font-bold text-orange-600 dark:text-orange-400'
                    : 'text-ink dark:text-ink-dark'
                }`}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

/** 로딩 중 — 검색 결과(건수 한 줄 → 거래 목록)의 골격을 회색으로 */
function SearchSkeleton() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="불러오는 중" className="pt-[4px]">
      <Skeleton width={96} height={12} />
      <View className="mt-[12px]">
        <SkeletonList rows={7} />
      </View>
    </View>
  );
}

/** '7. 22 (수) · 오후 2:30' */
function formatRowDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}. ${date.getDate()} (${WEEKDAY_KO[date.getDay()]}) · ${formatTimeKo(
    iso,
  )}`;
}

/**
 * 오타 추천 — 내장 상호명 사전에서 편집거리 2 이내의 가장 가까운 이름을 찾는다.
 * (AI API 없이 동작해야 하므로 사전 기반, 기획 v1.2)
 */
function findSimilarMerchant(keyword: string): string | null {
  const query = keyword.toLowerCase().replace(/\s+/g, '');
  let best: { name: string; distance: number } | null = null;

  MERCHANT_DICTIONARY.forEach(([name]) => {
    if (name.length < 2) {
      return;
    }
    const distance = editDistance(query, name.toLowerCase().replace(/\s+/g, ''));
    if (distance === 0 || distance > 2) {
      return;
    }
    if (!best || distance < best.distance) {
      best = { name, distance };
    }
  });

  return best ? (best as { name: string }).name : null;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) {
    return 99;
  }
  let prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    prev = current;
  }
  return prev[b.length] ?? 99;
}
