import type { Transaction, TransactionInput } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

/**
 * signal 은 TanStack Query 가 넘겨주는 취소 신호다.
 * 캘린더를 빠르게 넘기면 여러 달 요청이 동시에 뜨는데, 화면에서 사라진 요청은
 * 여기서 axios 로 signal 을 전달해야 실제로 끊긴다.
 */
export async function fetchTransactionsByMonth(
  month: string,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  if (USE_MOCK_API) {
    return mockApi.listTransactions({ month });
  }
  const { data } = await apiClient.get<Transaction[]>('/transactions', {
    params: { month },
    signal,
  });
  return data;
}

export async function searchTransactions(
  keyword: string,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  if (USE_MOCK_API) {
    return mockApi.listTransactions({ keyword });
  }
  const { data } = await apiClient.get<Transaction[]>('/transactions', {
    params: { keyword },
    signal,
  });
  return data;
}

export async function fetchTransaction(id: string, signal?: AbortSignal): Promise<Transaction> {
  if (USE_MOCK_API) {
    return mockApi.getTransaction(id);
  }
  const { data } = await apiClient.get<Transaction>(`/transactions/${id}`, { signal });
  return data;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  if (USE_MOCK_API) {
    return mockApi.createTransaction(input);
  }
  const { data } = await apiClient.post<Transaction>('/transactions', input);
  return data;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  if (USE_MOCK_API) {
    return mockApi.updateTransaction(id, input);
  }
  const { data } = await apiClient.patch<Transaction>(`/transactions/${id}`, input);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.deleteTransaction(id);
  }
  await apiClient.delete(`/transactions/${id}`);
}
