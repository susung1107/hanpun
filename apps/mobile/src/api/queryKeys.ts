/**
 * TanStack Query 키 팩토리.
 * 키를 한곳에서 관리해 무효화(invalidate) 범위를 실수 없이 지정한다.
 */
export const queryKeys = {
  me: ['me'] as const,

  transactions: {
    all: ['transactions'] as const,
    byMonth: (month: string) => ['transactions', 'month', month] as const,
    search: (keyword: string) => ['transactions', 'search', keyword] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
  },

  recurring: {
    all: ['recurring'] as const,
  },

  budgets: {
    all: ['budgets'] as const,
    byMonth: (month: string) => ['budgets', 'month', month] as const,
    progress: (month: string) => ['budgets', 'progress', month] as const,
  },

  stats: {
    all: ['stats'] as const,
    monthly: (month: string) => ['stats', 'monthly', month] as const,
    yearly: (year: number) => ['stats', 'yearly', year] as const,
  },

  classification: {
    personalRules: ['classification', 'personal-rules'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
  },
} as const;
