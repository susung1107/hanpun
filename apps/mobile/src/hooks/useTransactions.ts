import type { Transaction, TransactionInput } from '@hanpun/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import {
  createTransaction,
  deleteTransaction,
  fetchTransaction,
  fetchTransactionsByMonth,
  searchTransactions,
  updateTransaction,
} from '../api/transactions';
import { useDebouncedValue } from './useDebouncedValue';

/** 월 거래 목록 — 홈·캘린더·전체내역·통계가 공유한다 */
export function useMonthTransactions(month: string) {
  return useQuery({
    queryKey: queryKeys.transactions.byMonth(month),
    queryFn: ({ signal }) => fetchTransactionsByMonth(month, signal),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: ({ signal }) => fetchTransaction(id, signal),
  });
}

/**
 * 검색 — 타이핑이 멈춘 뒤(250ms) 키워드가 2자 이상일 때만 요청한다.
 * 디바운스가 없으면 한 글자마다 요청이 나가고, 늦게 도착한 짧은 키워드의 응답이
 * 화면을 덮어써 결과가 깜빡인다.
 */
export function useTransactionSearch(keyword: string) {
  const trimmed = useDebouncedValue(keyword.trim(), 250);
  const query = useQuery({
    queryKey: queryKeys.transactions.search(trimmed),
    queryFn: ({ signal }) => searchTransactions(trimmed, signal),
    enabled: trimmed.length >= 2,
  });
  return { ...query, keyword: trimmed };
}

/** 거래 관련 캐시를 한 번에 무효화한다 (목록·통계·예산 진행률이 함께 변한다) */
function useInvalidateTransactionCaches() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.transactions.all });
    client.invalidateQueries({ queryKey: queryKeys.stats.all });
    client.invalidateQueries({ queryKey: queryKeys.budgets.all });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactionCaches();
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactionCaches();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) =>
      updateTransaction(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactionCaches();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: invalidate,
  });
}

/** 같은 날짜끼리 묶어 섹션 리스트로 만든다 */
export interface TransactionSection {
  dateKey: string;
  items: Transaction[];
  dayExpense: number;
  dayIncome: number;
}

export function groupTransactionsByDate(rows: Transaction[]): TransactionSection[] {
  const map = new Map<string, TransactionSection>();

  rows.forEach(row => {
    const date = new Date(row.occurredAt);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    const section = map.get(dateKey) ?? { dateKey, items: [], dayExpense: 0, dayIncome: 0 };
    section.items.push(row);
    if (row.type === 'expense') {
      section.dayExpense += row.amount;
    } else {
      section.dayIncome += row.amount;
    }
    map.set(dateKey, section);
  });

  return [...map.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
