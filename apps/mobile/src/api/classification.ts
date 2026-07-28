import type { CategoryId, PersonalRule } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export async function fetchPersonalRules(): Promise<PersonalRule[]> {
  if (USE_MOCK_API) {
    return mockApi.listPersonalRules();
  }
  const { data } = await apiClient.get<PersonalRule[]>('/classification/rules');
  return data;
}

export async function createPersonalRule(input: {
  keyword: string;
  categoryId: CategoryId;
}): Promise<PersonalRule> {
  if (USE_MOCK_API) {
    return mockApi.createPersonalRule(input);
  }
  const { data } = await apiClient.post<PersonalRule>('/classification/rules', input);
  return data;
}

export async function deletePersonalRule(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.deletePersonalRule(id);
  }
  await apiClient.delete(`/classification/rules/${id}`);
}
