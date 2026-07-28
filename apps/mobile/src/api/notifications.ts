import type { AppNotification } from '@hanpun/shared';

import { USE_MOCK_API } from '../config';
import { mockApi } from '../mocks/api';
import { apiClient } from './client';

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (USE_MOCK_API) {
    return mockApi.listNotifications();
  }
  const { data } = await apiClient.get<AppNotification[]>('/notifications');
  return data;
}

export async function markNotificationsRead(): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.markNotificationsRead();
  }
  await apiClient.post('/notifications/read');
}
