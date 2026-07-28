import type { BudgetInput } from '@hanpun/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import { deleteBudget, fetchBudgetProgress, fetchBudgets, upsertBudget } from '../api/budgets';

export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets.byMonth(month),
    queryFn: () => fetchBudgets(month),
  });
}

export function useBudgetProgress(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets.progress(month),
    queryFn: () => fetchBudgetProgress(month),
  });
}

export function useUpsertBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => upsertBudget(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}

export function useDeleteBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}
