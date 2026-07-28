import type { Budget, BudgetInput, BudgetProgress } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export async function fetchBudgets(month: string): Promise<Budget[]> {
  if (USE_MOCK_API) {
    return mockApi.listBudgets(month);
  }
  const { data } = await apiClient.get<Budget[]>('/budgets', { params: { month } });
  return data;
}

export async function fetchBudgetProgress(month: string): Promise<BudgetProgress[]> {
  if (USE_MOCK_API) {
    return mockApi.getBudgetProgress(month);
  }
  const { data } = await apiClient.get<BudgetProgress[]>('/budgets/progress', {
    params: { month },
  });
  return data;
}

export async function upsertBudget(input: BudgetInput): Promise<Budget> {
  if (USE_MOCK_API) {
    return mockApi.upsertBudget(input);
  }
  const { data } = await apiClient.put<Budget>('/budgets', input);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.deleteBudget(id);
  }
  await apiClient.delete(`/budgets/${id}`);
}
