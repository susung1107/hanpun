import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import { fetchNotifications, markNotificationsRead } from '../api/notifications';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: fetchNotifications,
  });
}

export function useUnreadNotificationCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter(item => !item.read).length;
}

export function useMarkNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
