import type { RecurringRuleInput } from '@hanpun/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import {
  createRecurringRule,
  deleteRecurringRule,
  fetchRecurringRules,
  updateRecurringRule,
} from '../api/recurring';

export function useRecurringRules() {
  return useQuery({
    queryKey: queryKeys.recurring.all,
    queryFn: fetchRecurringRules,
  });
}

function useInvalidateRecurring() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: queryKeys.recurring.all });
    client.invalidateQueries({ queryKey: queryKeys.transactions.all });
  };
}

export function useCreateRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (input: RecurringRuleInput) => createRecurringRule(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<RecurringRuleInput> & { active?: boolean };
    }) => updateRecurringRule(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringRule(id),
    onSuccess: invalidate,
  });
}
