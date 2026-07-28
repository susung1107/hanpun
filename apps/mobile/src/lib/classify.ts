import type { CategoryId, ClassificationSuggestion, PersonalRule, TransactionType } from '@hanpun/shared';
import { getCategoriesByType } from '@hanpun/shared';

import { MERCHANT_DICTIONARY } from './merchantDictionary';

/**
 * 자동분류 추천 (AI API 미사용 — 개인 규칙 + 내장 상호명 사전).
 *
 * 우선순위
 *  1. 개인 규칙 (사용자가 직접 만든 키워드 → 카테고리)
 *  2. 내장 상호명 사전 (가장 긴 키워드가 먼저 매칭되도록 정렬)
 *  3. 폴백: 기타
 *
 * 반환된 추천은 항상 사용자가 탭 한 번으로 바꿀 수 있어야 한다(기획 확정).
 */
export function suggestCategory(
  title: string,
  type: TransactionType,
  personalRules: PersonalRule[] = [],
): ClassificationSuggestion {
  const normalized = normalize(title);
  const fallbackId: CategoryId = type === 'expense' ? 'etc' : 'incomeEtc';

  if (!normalized) {
    return { categoryId: fallbackId, source: 'fallback' };
  }

  const allowed = new Set(getCategoriesByType(type).map(category => category.id));

  const personalMatch = [...personalRules]
    .filter(rule => allowed.has(rule.categoryId))
    .sort((a, b) => b.keyword.length - a.keyword.length)
    .find(rule => normalized.includes(normalize(rule.keyword)));

  if (personalMatch) {
    return {
      categoryId: personalMatch.categoryId,
      source: 'personal',
      matchedKeyword: personalMatch.keyword,
    };
  }

  const dictionaryMatch = SORTED_DICTIONARY.find(
    ([keyword, categoryId]) => allowed.has(categoryId) && normalized.includes(keyword),
  );

  if (dictionaryMatch) {
    return {
      categoryId: dictionaryMatch[1],
      source: 'dictionary',
      matchedKeyword: dictionaryMatch[0],
    };
  }

  return { categoryId: fallbackId, source: 'fallback' };
}

/** 개인 규칙으로 기억할 내용 */
export interface CategoryMemoryPlan {
  keyword: string;
  categoryId: CategoryId;
  /** 같은 키워드의 기존 규칙 id — 있으면 지우고 새로 만든다 */
  replaces?: string;
}

/**
 * 사용자가 고른 카테고리를 개인 규칙으로 기억해야 하는지 판단한다.
 * 입력·수정 화면이 "다음부터 이 카테고리로 분류할게요" 라고 약속하므로 그 약속을 지키는 부분.
 *
 * 기억하지 않는 경우
 *  - 내역이 한 글자 — 규칙이 너무 넓어 엉뚱한 거래까지 끌어온다
 *  - 이미 같은 키워드·같은 카테고리 규칙이 있다
 *  - 내장 사전이 이미 같은 결론을 낸다 — 규칙을 더해도 달라지는 게 없다
 */
export function planCategoryMemory(params: {
  title: string;
  type: TransactionType;
  categoryId: CategoryId;
  rules: PersonalRule[];
}): CategoryMemoryPlan | null {
  const keyword = params.title.trim();
  if (keyword.length < 2) {
    return null;
  }
  if (!getCategoriesByType(params.type).some(category => category.id === params.categoryId)) {
    return null;
  }

  const normalizedKeyword = normalize(keyword);
  const existing = params.rules.find(rule => normalize(rule.keyword) === normalizedKeyword);
  if (existing && existing.categoryId === params.categoryId) {
    return null;
  }
  if (
    !existing &&
    suggestCategory(keyword, params.type, params.rules).categoryId === params.categoryId
  ) {
    return null;
  }

  return { keyword, categoryId: params.categoryId, replaces: existing?.id };
}

/** 긴 키워드 우선 매칭 (예: '쿠팡이츠' 가 '쿠팡' 보다 먼저) */
const SORTED_DICTIONARY = [...MERCHANT_DICTIONARY]
  .map(([keyword, categoryId]) => [normalize(keyword), categoryId] as const)
  .sort((a, b) => b[0].length - a[0].length);

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}
