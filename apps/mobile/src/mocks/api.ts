import type {
  AppNotification,
  Budget,
  BudgetInput,
  BudgetProgress,
  CategoryStat,
  DayStat,
  ExpenseCategoryId,
  MonthlyStats,
  PersonalRule,
  RecurringRule,
  RecurringRuleInput,
  Transaction,
  TransactionInput,
  User,
  YearlyStats,
} from '@hanpun/shared';
import { daysInMonth, shiftMonth, toDateKey, toMonthKey } from '@hanpun/shared';

import { ApiError } from '../api/errors';
import { db, nextId } from './db';

/** 네트워크처럼 보이게 하는 지연 */
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function monthKeyOf(iso: string): string {
  return toMonthKey(new Date(iso));
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortByOccurredAtDesc(rows: Transaction[]): Transaction[] {
  return [...rows].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export const mockApi = {
  // ── 인증 ────────────────────────────────────────────────
  async devSignIn(): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    return delay({
      user: db.user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  },

  async getMe(): Promise<User> {
    return delay(db.user);
  },

  async deleteAccount(): Promise<void> {
    db.transactions = [];
    db.recurringRules = [];
    db.budgets = [];
    db.personalRules = [];
    return delay(undefined);
  },

  // ── 거래 ────────────────────────────────────────────────
  async listTransactions(params: { month?: string; keyword?: string }): Promise<Transaction[]> {
    let rows = db.transactions;
    if (params.month) {
      rows = rows.filter(row => monthKeyOf(row.occurredAt) === params.month);
    }
    if (params.keyword) {
      const keyword = params.keyword.trim().toLowerCase();
      rows = rows.filter(
        row =>
          row.title.toLowerCase().includes(keyword) ||
          (row.memo ?? '').toLowerCase().includes(keyword),
      );
    }
    return delay(sortByOccurredAtDesc(rows));
  },

  async getTransaction(id: string): Promise<Transaction> {
    const found = db.transactions.find(row => row.id === id);
    if (!found) {
      throw new ApiError('거래를 찾을 수 없어요.', 404);
    }
    return delay(found);
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    const created: Transaction = {
      id: nextId('tx'),
      ...input,
      memo: input.memo ?? null,
      recurringRuleId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.transactions = sortByOccurredAtDesc([created, ...db.transactions]);
    return delay(created);
  },

  async updateTransaction(id: string, input: TransactionInput): Promise<Transaction> {
    const index = db.transactions.findIndex(row => row.id === id);
    if (index < 0) {
      throw new ApiError('거래를 찾을 수 없어요.', 404);
    }
    const updated: Transaction = {
      ...db.transactions[index]!,
      ...input,
      memo: input.memo ?? null,
      updatedAt: nowIso(),
    };
    db.transactions[index] = updated;
    db.transactions = sortByOccurredAtDesc(db.transactions);
    return delay(updated);
  },

  async deleteTransaction(id: string): Promise<void> {
    db.transactions = db.transactions.filter(row => row.id !== id);
    return delay(undefined);
  },

  // ── 고정지출(반복) ───────────────────────────────────────
  async listRecurringRules(): Promise<RecurringRule[]> {
    return delay([...db.recurringRules].sort((a, b) => a.dayAnchor - b.dayAnchor));
  },

  async createRecurringRule(input: RecurringRuleInput): Promise<RecurringRule> {
    const created: RecurringRule = {
      id: nextId('rr'),
      ...input,
      memo: input.memo ?? null,
      month: input.month ?? null,
      endsAt: input.endsAt ?? null,
      active: true,
      lastGeneratedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.recurringRules = [...db.recurringRules, created];
    return delay(created);
  },

  async updateRecurringRule(
    id: string,
    input: Partial<RecurringRuleInput> & { active?: boolean },
  ): Promise<RecurringRule> {
    const index = db.recurringRules.findIndex(row => row.id === id);
    if (index < 0) {
      throw new ApiError('고정지출을 찾을 수 없어요.', 404);
    }
    const updated: RecurringRule = {
      ...db.recurringRules[index]!,
      ...input,
      updatedAt: nowIso(),
    };
    db.recurringRules[index] = updated;
    return delay(updated);
  },

  async deleteRecurringRule(id: string): Promise<void> {
    db.recurringRules = db.recurringRules.filter(row => row.id !== id);
    return delay(undefined);
  },

  // ── 예산 ────────────────────────────────────────────────
  async listBudgets(month: string): Promise<Budget[]> {
    return delay(db.budgets.filter(row => row.month === month));
  },

  async upsertBudget(input: BudgetInput): Promise<Budget> {
    const index = db.budgets.findIndex(
      row => row.month === input.month && row.categoryId === input.categoryId,
    );
    if (index >= 0) {
      const updated: Budget = { ...db.budgets[index]!, amount: input.amount, updatedAt: nowIso() };
      db.budgets[index] = updated;
      return delay(updated);
    }
    const created: Budget = {
      id: nextId('bd'),
      ...input,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.budgets = [...db.budgets, created];
    return delay(created);
  },

  async deleteBudget(id: string): Promise<void> {
    db.budgets = db.budgets.filter(row => row.id !== id);
    return delay(undefined);
  },

  async getBudgetProgress(month: string): Promise<BudgetProgress[]> {
    const budgets = db.budgets.filter(row => row.month === month);
    const expenses = db.transactions.filter(
      row => row.type === 'expense' && monthKeyOf(row.occurredAt) === month,
    );

    return delay(
      budgets.map(budget => {
        const spentAmount = expenses
          .filter(row => (budget.categoryId ? row.categoryId === budget.categoryId : true))
          .reduce((total, row) => total + row.amount, 0);
        return {
          categoryId: budget.categoryId,
          budgetAmount: budget.amount,
          spentAmount,
          ratio: budget.amount > 0 ? spentAmount / budget.amount : 0,
        };
      }),
    );
  },

  // ── 통계 ────────────────────────────────────────────────
  async getMonthlyStats(month: string): Promise<MonthlyStats> {
    const rows = db.transactions.filter(row => monthKeyOf(row.occurredAt) === month);
    const expenses = rows.filter(row => row.type === 'expense');
    const incomes = rows.filter(row => row.type === 'income');

    const totalExpense = sum(expenses);
    const prevMonth = shiftMonth(month, -1);
    const prevMonthExpense = sum(
      db.transactions.filter(
        row => row.type === 'expense' && monthKeyOf(row.occurredAt) === prevMonth,
      ),
    );

    const byCategory = groupByCategory(expenses, totalExpense);
    const byDay = groupByDay(rows, month);

    return delay({
      month,
      totalExpense,
      totalIncome: sum(incomes),
      prevMonthExpense,
      byCategory,
      byDay,
    });
  },

  async getYearlyStats(year: number): Promise<YearlyStats> {
    const rows = db.transactions.filter(row => new Date(row.occurredAt).getFullYear() === year);
    const expenses = rows.filter(row => row.type === 'expense');
    const totalExpense = sum(expenses);

    const byMonth = Array.from({ length: 12 }, (_, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
      const monthRows = rows.filter(row => monthKeyOf(row.occurredAt) === monthKey);
      return {
        month: monthKey,
        expense: sum(monthRows.filter(row => row.type === 'expense')),
        income: sum(monthRows.filter(row => row.type === 'income')),
      };
    });

    return delay({
      year,
      totalExpense,
      totalIncome: sum(rows.filter(row => row.type === 'income')),
      byMonth,
      byCategory: groupByCategory(expenses, totalExpense),
    });
  },

  // ── 자동분류 개인 규칙 ───────────────────────────────────
  async listPersonalRules(): Promise<PersonalRule[]> {
    return delay(db.personalRules);
  },

  async createPersonalRule(input: {
    keyword: string;
    categoryId: PersonalRule['categoryId'];
  }): Promise<PersonalRule> {
    const created: PersonalRule = {
      id: nextId('pr'),
      keyword: input.keyword,
      categoryId: input.categoryId,
      createdAt: nowIso(),
    };
    db.personalRules = [created, ...db.personalRules];
    return delay(created);
  },

  async deletePersonalRule(id: string): Promise<void> {
    db.personalRules = db.personalRules.filter(row => row.id !== id);
    return delay(undefined);
  },

  // ── 알림 목록 ───────────────────────────────────────────
  async listNotifications(): Promise<AppNotification[]> {
    return delay(db.notifications);
  },

  async markNotificationsRead(): Promise<void> {
    db.notifications = db.notifications.map(row => ({ ...row, read: true }));
    return delay(undefined);
  },
};

function sum(rows: Transaction[]): number {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function groupByCategory(rows: Transaction[], total: number): CategoryStat[] {
  const map = new Map<string, { amount: number; count: number }>();
  rows.forEach(row => {
    const current = map.get(row.categoryId) ?? { amount: 0, count: 0 };
    map.set(row.categoryId, { amount: current.amount + row.amount, count: current.count + 1 });
  });

  return [...map.entries()]
    .map(([categoryId, value]) => ({
      categoryId: categoryId as CategoryStat['categoryId'],
      amount: value.amount,
      count: value.count,
      ratio: total > 0 ? value.amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * 월 전체 일수를 0 으로 먼저 깔고 거래를 더한다.
 * 거래가 있는 날만 내보내면 통계 화면의 막대·x축 라벨이 실제 날짜와 어긋난다
 * (DayStat 주석의 계약 — 서버도 같은 규칙을 지켜야 한다).
 */
function groupByDay(rows: Transaction[], month: string): DayStat[] {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const total = daysInMonth(year, monthNumber);

  const stats: DayStat[] = Array.from({ length: total }, (_, index) => ({
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    expense: 0,
    income: 0,
  }));

  const byDate = new Map(stats.map(stat => [stat.date, stat]));
  rows.forEach(row => {
    const target = byDate.get(toDateKey(new Date(row.occurredAt)));
    if (!target) {
      return;
    }
    if (row.type === 'expense') {
      target.expense += row.amount;
    } else {
      target.income += row.amount;
    }
  });

  return stats;
}

export type MockExpenseCategoryId = ExpenseCategoryId;
