import type { RecurringRule, RecurringRuleInput } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export async function fetchRecurringRules(): Promise<RecurringRule[]> {
  if (USE_MOCK_API) {
    return mockApi.listRecurringRules();
  }
  const { data } = await apiClient.get<RecurringRule[]>('/recurring');
  return data;
}

export async function createRecurringRule(input: RecurringRuleInput): Promise<RecurringRule> {
  if (USE_MOCK_API) {
    return mockApi.createRecurringRule(input);
  }
  const { data } = await apiClient.post<RecurringRule>('/recurring', input);
  return data;
}

export async function updateRecurringRule(
  id: string,
  input: Partial<RecurringRuleInput> & { active?: boolean },
): Promise<RecurringRule> {
  if (USE_MOCK_API) {
    return mockApi.updateRecurringRule(id, input);
  }
  const { data } = await apiClient.patch<RecurringRule>(`/recurring/${id}`, input);
  return data;
}

export async function deleteRecurringRule(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.deleteRecurringRule(id);
  }
  await apiClient.delete(`/recurring/${id}`);
}
