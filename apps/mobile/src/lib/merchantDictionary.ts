import type { CategoryId } from '@hanpun/shared';

/**
 * 내장 상호명 사전 — 자동분류 v1 (AI API 사용하지 않음).
 *
 * 규칙: 입력된 내역 문자열에 키워드가 포함되면 해당 카테고리를 추천한다.
 * 사전은 앱에 내장하고, 서버가 배포하는 버전(dictionaryVersion)이 더 높으면 갱신 다운로드한다.
 * 개인 규칙(personal_rules)이 항상 사전보다 우선한다.
 */

export const DICTIONARY_VERSION = 1;

type DictionaryEntry = readonly [keyword: string, categoryId: CategoryId];

export const MERCHANT_DICTIONARY: readonly DictionaryEntry[] = [
  // 식비
  ['스타벅스', 'food'],
  ['starbucks', 'food'],
  ['투썸', 'food'],
  ['이디야', 'food'],
  ['메가커피', 'food'],
  ['컴포즈', 'food'],
  ['빽다방', 'food'],
  ['배달의민족', 'food'],
  ['배민', 'food'],
  ['요기요', 'food'],
  ['쿠팡이츠', 'food'],
  ['맥도날드', 'food'],
  ['버거킹', 'food'],
  ['롯데리아', 'food'],
  ['맘스터치', 'food'],
  ['김밥천국', 'food'],
  ['백반', 'food'],
  ['국밥', 'food'],
  ['치킨', 'food'],
  ['피자', 'food'],
  ['이마트', 'food'],
  ['홈플러스', 'food'],
  ['롯데마트', 'food'],
  ['gs25', 'food'],
  ['씨유', 'food'],
  ['cu', 'food'],
  ['세븐일레븐', 'food'],
  ['편의점', 'food'],

  // 교통
  ['지하철', 'transport'],
  ['버스', 'transport'],
  ['택시', 'transport'],
  ['카카오t', 'transport'],
  ['카카오택시', 'transport'],
  ['티머니', 'transport'],
  ['코레일', 'transport'],
  ['ktx', 'transport'],
  ['srt', 'transport'],
  ['고속버스', 'transport'],
  ['주차', 'transport'],
  ['통행료', 'transport'],
  ['하이패스', 'transport'],
  ['주유', 'transport'],
  ['gs칼텍스', 'transport'],
  ['sk에너지', 'transport'],
  ['따릉이', 'transport'],
  ['쏘카', 'transport'],

  // 주거
  ['월세', 'housing'],
  ['전세', 'housing'],
  ['관리비', 'housing'],
  ['임대료', 'housing'],
  ['이사', 'housing'],
  ['가구', 'housing'],
  ['이케아', 'housing'],
  ['다이소', 'housing'],

  // 공과금
  ['전기요금', 'utility'],
  ['한국전력', 'utility'],
  ['한전', 'utility'],
  ['가스요금', 'utility'],
  ['도시가스', 'utility'],
  ['수도요금', 'utility'],
  ['상하수도', 'utility'],
  ['난방비', 'utility'],
  ['tv수신료', 'utility'],

  // 통신
  ['skt', 'telecom'],
  ['kt', 'telecom'],
  ['lg유플러스', 'telecom'],
  ['lgu+', 'telecom'],
  ['알뜰폰', 'telecom'],
  ['통신요금', 'telecom'],
  ['인터넷요금', 'telecom'],

  // 쇼핑
  ['쿠팡', 'shopping'],
  ['네이버쇼핑', 'shopping'],
  ['11번가', 'shopping'],
  ['g마켓', 'shopping'],
  ['옥션', 'shopping'],
  ['무신사', 'shopping'],
  ['에이블리', 'shopping'],
  ['지그재그', 'shopping'],
  ['올리브영', 'shopping'],
  ['유니클로', 'shopping'],
  ['자라', 'shopping'],
  ['탑텐', 'shopping'],
  ['백화점', 'shopping'],
  ['아웃렛', 'shopping'],
  ['애플', 'shopping'],
  ['쿠팡와우', 'shopping'],

  // 의료/건강
  ['병원', 'health'],
  ['의원', 'health'],
  ['약국', 'health'],
  ['치과', 'health'],
  ['한의원', 'health'],
  ['안과', 'health'],
  ['피부과', 'health'],
  ['건강검진', 'health'],
  ['헬스', 'health'],
  ['필라테스', 'health'],
  ['요가', 'health'],
  ['영양제', 'health'],

  // 문화/여가
  ['cgv', 'culture'],
  ['메가박스', 'culture'],
  ['롯데시네마', 'culture'],
  ['넷플릭스', 'culture'],
  ['netflix', 'culture'],
  ['유튜브', 'culture'],
  ['youtube', 'culture'],
  ['왓챠', 'culture'],
  ['티빙', 'culture'],
  ['쿠팡플레이', 'culture'],
  ['웨이브', 'culture'],
  ['멜론', 'culture'],
  ['스포티파이', 'culture'],
  ['spotify', 'culture'],
  ['교보문고', 'culture'],
  ['yes24', 'culture'],
  ['알라딘', 'culture'],
  ['인터파크', 'culture'],
  ['공연', 'culture'],
  ['콘서트', 'culture'],
  ['노래방', 'culture'],
  ['pc방', 'culture'],
  ['스팀', 'culture'],
  ['steam', 'culture'],
  ['여행', 'culture'],
  ['숙박', 'culture'],
  ['야놀자', 'culture'],
  ['에어비앤비', 'culture'],

  // 경조사
  ['축의금', 'event'],
  ['부의금', 'event'],
  ['조의금', 'event'],
  ['결혼식', 'event'],
  ['돌잔치', 'event'],
  ['장례', 'event'],
  ['선물', 'event'],
  ['화환', 'event'],

  // 수입
  ['급여', 'salary'],
  ['월급', 'salary'],
  ['상여', 'salary'],
  ['보너스', 'salary'],
  ['용돈', 'allowance'],
  ['이자', 'financeIncome'],
  ['배당', 'financeIncome'],
  ['환급', 'financeIncome'],
  ['중고', 'sideIncome'],
  ['당근', 'sideIncome'],
] as const;
