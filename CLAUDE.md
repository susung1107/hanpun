# 한푼 (hanpun) — 프로젝트 규칙

Claude Code 가 이 저장소에서 작업할 때 반드시 지켜야 하는 규칙과 배경 지식.

## 1. 제품 요약

- **한푼** — 한국형 가계부 앱. iOS · Android (React Native).
- 핵심 가치: **3초 입력**. 금액 → 카테고리 → 저장.
- 브랜드 컬러 오렌지 `#EB6834`. 라이트 · 다크 모두 필수.
- 카테고리는 **고정**: 지출 10종 + 수입 5종. 사용자 추가 없음.
- **온라인 기반 + 캐시 열람** 구조. 쓰기는 항상 서버, 읽기는 TanStack Query 캐시로 오프라인 열람 가능. **로컬 DB(SQLite) 없음.**
- 로그인 필수 (카카오 · 구글 · Apple). 게스트 모드 없음.
- 자동 분류는 **AI API 없이** 내장 상호명 사전 + 개인 규칙으로 처리.
- 반복거래는 **서버 스케줄러**가 생성한다. 클라이언트는 생성하지 않는다.

## 2. 저장소 구조 (pnpm 모노레포)

```
hanpun/
├── apps/
│   ├── mobile/          React Native 0.81 앱 (프론트엔드 — 완성)
│   └── server/          NestJS API 서버 (수성이 직접 구현)
├── packages/
│   └── shared/          앱·서버 공용 타입 / 포맷 / 카테고리 / 날짜 유틸
├── docker-compose.yml   MySQL 8 로컬 개발 DB
└── pnpm-workspace.yaml
```

`apps/mobile/src` 내부:

```
api/          axios 기반 API 호출 (USE_MOCK_API 분기 포함)
components/   재사용 UI (index.ts 가 유일한 공개 진입점)
hooks/        TanStack Query 훅 + 화면 로직
lib/          네이티브 연동 (알림, 생체인증 등)
mocks/        서버 없이 동작하는 목 API
navigation/   RootNavigator / TabNavigator / types
screens/      화면 16종
store/        Zustand (auth, settings) — UI·세션 상태만
styles/       global.css (NativeWind)
theme/        tokens.ts, classes.ts, ThemeProvider
```

## 3. 절대 규칙 (바이블 원칙)

코드 · 아키텍처 · 폴더 구조 · 네이밍 · 설정은 **항상 공식 문서 / 업계 표준 정석**을 따른다. 임의 축약이나 편법 금지.

### 3-1. 쓰면 안 되는 것

| 금지 | 이유 · 대체 |
| --- | --- |
| **Expo** | React Native CLI 전용 프로젝트다. |
| **FlashList** | 과거 버그 이력. **`FlatList` 만 사용.** |
| **로컬 DB (SQLite / Drizzle / op-sqlite)** | 온라인 기반 구조로 확정. 캐시는 TanStack Query persist. |
| **PostgreSQL** | DB 는 **MySQL 8**. |
| **`nativewind` 4.2.x 이상** | css-interop 0.2.x 가 Reanimated 4 의 `react-native-worklets/plugin` 을 요구해 번들이 깨진다. **`4.1.23` 정확히 고정 유지.** |
| **`react-native-screens` 4.26.x 이상** | 4.26.0 이 추가한 `setToolbarMenuElementOptions` 커맨드가 첫 인자를 `React.ComponentRef<>` 로 선언하는데, RN 0.81 의 코드젠 파서는 `React.ElementRef<>` 만 받는다. `pod install` 이 코드젠 단계에서 실패한다. **`4.25.2` 정확히 고정 유지.** |

### 3-2. 버전 고정 주의

`apps/mobile/package.json` 에서 캐럿(`^`) 없이 **정확 고정된 버전은 의도된 것이다. 범위로 되돌리지 말 것.**

| 패키지 | 고정 버전 | 해제 조건 |
| --- | --- | --- |
| `nativewind` | `4.1.23` | Reanimated 를 4 로 올릴 때 |
| `react-native-screens` | `4.25.2` | React Native 를 0.82 이상으로 올릴 때 |

두 건 모두 **설치는 성공하는데 빌드/번들 단계에서만 깨지는** 종류라 `pnpm install` 결과만 보고는 알 수 없다. 버전을 올릴 때는 반드시 iOS 코드젠까지 확인한다.

```bash
cd apps/mobile
node ../../node_modules/react-native/scripts/generate-codegen-artifacts.js -p . -o /tmp/cg -t ios
```

## 4. 스타일링 규칙

**NativeWind 우선.** `className` + `dark:` 변형으로 작성하고, `tailwind.config.js` 의 토큰만 사용한다.

```tsx
<View className="rounded-card bg-surface p-4 dark:bg-surface-dark">
  <Text className="text-title2 font-bold text-ink dark:text-ink-dark">제목</Text>
</View>
```

`useTheme().tokens` 는 **NativeWind 가 닿지 않는 곳에서만** 쓴다:

- lucide 아이콘의 `color`
- react-native-svg 의 `fill` / `stroke`
- `StatusBar`, React Navigation 테마
- 인라인 `shadow` · 계산된 크기/위치

색상 리터럴을 새로 하드코딩하지 말고 `tailwind.config.js` → `theme/tokens.ts` 순서로 토큰을 먼저 찾는다. 디자인에만 있는 일회성 색(알림 종류별 배지 등)은 해당 파일 상단 상수로 모아 둔다.

반복되는 묶음은 `theme/classes.ts` 의 `cx.page` · `cx.card` · `cx.cardLg` 를 쓴다.

### 4-1. 금액 표기

금액 포맷은 **`packages/shared/src/format.ts` 에만 둔다.** 화면 파일에 지역 포맷터를 만들지 말 것 — 같은 금액이 화면마다 다르게 보이게 된다.

| 함수 | 쓰는 곳 | 예 |
| --- | --- | --- |
| `formatNumber` | 천 단위 구분자만 | `1,284,500` |
| `formatWon` | 요약 카드 대형 금액 | `₩1,284,500` |
| `formatAmountKo` | 본문 금액 | `4,500원` |
| `formatSignedAmount` | 리스트 행 (부호 포함) | `-4,500원` |
| `formatCompactWon` | 폭이 좁은 곳 | `128만원` · `3.2억원` |
| `formatBudgetWon` | 예산처럼 값이 정확해야 하는 곳 | `200만원` / `2,004,500원` |

`formatCompactWon(value, { unit: false, exactBelow })` 로 '원' 을 빼거나 축약 시작 금액을 올릴 수 있다 (캘린더 날짜 칸).

## 5. 컴포넌트 규칙

- **`src/components/index.ts` 가 유일한 공개 진입점이다.** 개별 파일을 직접 import 하지 말고, 무엇이 있는지 확인할 때도 이 파일을 먼저 본다. (예: `SectionLabel` 은 `ListRow.tsx`, `InputRow`·`SelectRow` 는 `FieldRow.tsx` 안에 있다.)
- 새 컴포넌트를 만들면 반드시 `index.ts` 에 export 를 추가한다.
- 화면 파일에서만 쓰는 소규모 서브 컴포넌트는 그 화면 파일 안에 두고 export 하지 않는다.
- 모든 터치 요소에 `accessibilityRole` 을 붙인다.
- **함수형 `style={({ pressed }) => ...}` 를 절대 쓰지 말 것.** NativeWind(`jsxImportSource`) 아래에서 함수형 `style` 은 통째로 무시돼 위치·크기·색이 안 먹는다(객체·배열 반환 모두). 눌림 피드백은 **정적 `style` + `usePressed()` 훅**(`hooks/usePressed.ts`)으로 처리한다. 파괴적 버튼(삭제·탈퇴)은 `Button` 의 `danger` variant 를 쓴다 — 별도 `Pressable` 로 새로 만들지 말 것.
- **반복 UI는 공용 컴포넌트로 통일한다.** 카드+행 리스트(사이 구분선)는 `ListCard`, 삭제·로그아웃·탈퇴 확인 다이얼로그는 `ConfirmDialog`, 탭 화면 헤더는 `TabHeader`. 화면마다 `map`+`border-b` 나 다이얼로그 마크업을 새로 짜지 말 것.
- **타이포는 인라인 클래스 대신 `theme/classes.ts` 의 `cx.*` 를 쓴다** (`cx.title1/title2/body/caption/label/sectionTitle/screenTitle/hero`). 아이콘 배경 틴트는 `tokens.neutralTint/criticalTint/accentTint`, 안내 배너는 `tokens.bannerBg/bannerBorder`, 차트 빈 막대는 `tokens.chartEmpty`. 회색·틴트 hex 를 다시 하드코딩하지 말 것.

## 6. 데이터 계층 규칙

- 서버 상태는 **TanStack Query 전용**. Zustand 에 서버 데이터를 복사하지 않는다.
- Zustand 는 `authStore`(세션) · `settingsStore`(앱 설정) 두 개뿐. 둘 다 AsyncStorage 로 persist 된다.
- 쿼리 훅은 `src/hooks/` 에만 둔다. 화면에서 `useQuery` 를 직접 호출하지 않는다.
- 뮤테이션 후에는 관련 쿼리를 `invalidateQueries` 로 무효화한다.
- `getCategory(id)` 는 **절대 throw 하지 않는다** (미지의 id 는 `etc` 로 폴백). try/catch 로 감싸지 말 것.

### 에러 처리

- `ApiError` 는 **`src/api/errors.ts`** 에 있다 (`client.ts` 에서 재수출). 목 API 도 같은 타입을 던지므로 화면은 서버/목을 구분하지 않는다. 에러 타입만 필요한 곳에서 `client.ts` 를 import 하지 말 것 — axios·authStore·AsyncStorage 가 함께 끌려온다.
- 뮤테이션 실패 알림은 **`lib/queryClient.ts` 의 전역 `MutationCache`** 가 한 곳에서 띄운다. 화면마다 Alert 를 붙이지 않는다. 사용자를 막지 않는 부수 작업은 `meta: { silent: true }` 로 알림을 끈다.
- 화면에서 `await …mutateAsync()` 를 쓸 때는 **반드시 try/catch 로 감싸고 실패 시 `return`** 한다. catch 가 없으면 저장에 실패해도 화면이 닫혀 성공한 것처럼 보이고, unhandled rejection 이 남는다.
- 뮤테이션 훅이 아닌 API 함수를 직접 호출하는 곳(예: `deleteAccount`)은 전역 알림이 닿지 않으므로 그 자리에서 Alert 를 띄운다.
- 상세·수정 화면은 `isLoading` 만 보지 말고 **`isError` 분기를 따로 그린다.** 이미 삭제된 항목으로 진입하면 무한 스피너가 된다.
- 401 은 즉시 로그아웃이 아니라 `/auth/refresh` 로 한 번 갱신을 시도하고, 갱신이 실패할 때만 세션을 버린다 (`src/api/client.ts`).

### 목 API 스위치

`src/config.ts` 의 `USE_MOCK_API` 가 `true` 인 동안 앱은 서버 없이 완전 동작한다. `src/api/*` 의 모든 함수가 이 플래그로 분기한다.

**서버(M1)가 준비되면 `USE_MOCK_API = false` 한 줄만 바꾼다.** API 시그니처를 목에 맞춰 바꾸는 게 아니라, 서버를 API 계약서에 맞춘다.

## 7. 검증 (커밋 전 필수)

모든 명령은 **저장소 최상위**(`~/dev/hanpun`)에서 실행한다. `apps/mobile` 안에서 pnpm 을 돌리면 워크스페이스 링크가 깨진다.

```bash
pnpm typecheck     # 워크스페이스 전체 tsc --noEmit
pnpm lint          # eslint (apps/mobile)
pnpm test          # jest (apps/mobile)
```

번들이 실제로 만들어지는지까지 확인하려면:

```bash
cd apps/mobile
npx react-native bundle --entry-file index.js --platform ios --dev false \
  --bundle-output /tmp/hanpun.bundle.js --assets-dest /tmp/hanpun-assets
```

세 명령이 모두 통과하지 않으면 작업을 끝내지 않는다.

## 8. 실행

```bash
pnpm install
(cd apps/mobile && bundle install)   # 최초 1회 — Gemfile 의 CocoaPods
pnpm pods                            # iOS 최초 1회 / 네이티브 의존성 변경 시
pnpm ios                             # 또는 pnpm android
```

`pods` 는 `bundle exec pod install` 이므로 `bundle install` 이 선행되어야 한다.

`pnpm db:up` 으로 MySQL 8 컨테이너를 띄운다 (서버 작업 시).

pnpm 10 은 의존성의 postinstall 을 기본 차단한다. 허용 목록은 `pnpm-workspace.yaml` 의 `onlyBuiltDependencies` 에 둔다 (현재 `sharp` 하나 — `react-native-bootsplash` 의 에셋 생성 CLI 용). 새 패키지가 빌드 스크립트를 요구하면 **왜 필요한지 주석과 함께** 이 목록에 추가하고, 근거 없이는 추가하지 않는다.

## 9. 역할 분담

- **프론트엔드**: Claude 담당. 디자인 → UI → API 연결.
- **백엔드 (NestJS · Prisma · MySQL)**: 수성이 직접 구현하고 Claude 는 코칭한다. **요청받지 않은 서버 코드를 대신 작성하지 않는다.**
- **QA · 테스트**: 마일스톤 후반에 별도 게이트로 진행.

## 10. 커밋 · 문서

- 커밋 메시지는 한국어 현재형 요약 한 줄. 예: `홈 화면 예산 진행바 추가`
- 기획이 바뀌면 관련 산출물을 **함께** 갱신한다. 부분 갱신 금지.
- 코드 주석은 **왜** 그렇게 했는지를 적는다. 무엇을 하는지는 코드가 말한다.
