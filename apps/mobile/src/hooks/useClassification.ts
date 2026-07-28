import type { CategoryId } from '@hanpun/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '../api/queryKeys';
import {
  createPersonalRule,
  deletePersonalRule,
  fetchPersonalRules,
} from '../api/classification';
import type { CategoryMemoryPlan } from '../lib/classify';

export function usePersonalRules() {
  return useQuery({
    queryKey: queryKeys.classification.personalRules,
    queryFn: fetchPersonalRules,
  });
}

export function useCreatePersonalRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { keyword: string; categoryId: CategoryId }) => createPersonalRule(input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classification.personalRules });
    },
  });
}

/**
 * 자동분류 결과를 사용자가 고친 선택을 개인 규칙으로 저장한다 (lib/classify 의 planCategoryMemory 와 짝).
 *
 * 거래 저장은 이미 성공한 뒤에 부수적으로 실행되므로 실패해도 사용자를 막지 않는다.
 * 그래서 meta.silent 로 전역 실패 알림을 끄고, 다음 입력 때 다시 기억할 기회를 남긴다.
 */
export function useRememberCategory() {
  const client = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async (plan: CategoryMemoryPlan) => {
      if (plan.replaces) {
        await deletePersonalRule(plan.replaces);
      }
      return createPersonalRule({ keyword: plan.keyword, categoryId: plan.categoryId });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classification.personalRules });
    },
  });
}

export function useDeletePersonalRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePersonalRule(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classification.personalRules });
    },
  });
}
