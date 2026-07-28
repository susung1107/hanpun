# 한푼 Git 전략

이 문서는 한푼 저장소에서 브랜치·커밋·PR·출시를 다루는 방식을 정한다.
저장소: https://github.com/susung1107/hanpun

## 1. 브랜치 구조

```
main      ← 출시된 것만. 태그가 붙는 브랜치.
  ↑ (--no-ff 머지, 출시 시점에만)
develop   ← 개발 최종. 기본 브랜치. 항상 배포 가능한 상태를 지향.
  ↑ (PR + --no-ff 머지)
작업 브랜치 ← 기능·수정 단위. develop 에서 파고 develop 으로 되돌린다.
```

- **main**: 실제 출시된 코드만 올라간다. 여기서 직접 개발하지 않는다.
- **develop**: 개발의 최종 통합 지점이자 **기본 브랜치**. 모든 작업 브랜치는 여기서 시작하고 여기로 병합된다.
- **작업 브랜치**: 하나의 작업(기능/수정/문서 등)만 담는다.

## 2. 브랜치 이름 규칙

```
<접두사>/<소문자-영문-케밥케이스>
```

| 접두사 | 용도 | 예 |
| --- | --- | --- |
| `feature/` | 새 기능 | `feature/home-budget-bar` |
| `fix/` | 버그·오류 수정 | `fix/unused-import` |
| `refactor/` | 동작 변화 없는 구조 개선 | `refactor/list-card` |
| `docs/` | 문서 | `docs/git-workflow` |
| `chore/` | 빌드·설정·잡무 | `chore/bump-deps` |

- **한글·공백·대문자 금지.** 단어 구분은 하이픈(`-`).
- **브랜치 하나에 작업 하나만.** 여러 작업을 한 브랜치에 섞지 않는다.

## 3. 커밋 메시지 형식

```
<종류>: <한국어 한 줄 요약>
```

- `<종류>` 는 브랜치 접두사와 같은 어휘(`feature`·`fix`·`refactor`·`docs`·`chore`)를 쓴다.
- 요약은 **한국어 현재형 한 줄**.

예:

```
feature: 홈 화면 예산 진행바 추가
fix: AccountScreen 미사용 Pressable import 제거
docs: 브랜치 전략 문서와 PR 템플릿 추가
```

## 4. 작업 흐름

```
1. git checkout develop && git pull   # develop 최신화
2. git checkout -b <접두사>/<이름>       # 작업 브랜치 생성
3. 작업
4. pnpm typecheck && pnpm lint && pnpm test   # 저장소 최상위에서 (셋 다 통과해야 함)
5. git push -u origin <브랜치명>
6. PR 생성 (base: develop)             # gh pr create --base develop
7. 리뷰 → 머지 → 작업 브랜치 삭제
```

- 4번 검증은 **저장소 최상위**에서 실행한다(`apps/mobile` 안에서 pnpm 을 돌리면 워크스페이스 링크가 깨진다).
- 세 명령이 모두 통과하지 않으면 push·PR 하지 않는다.

## 5. 금지·규칙

- **`main`·`develop` 에 직접 커밋 금지.** 반드시 작업 브랜치 → PR 을 거친다.
- **머지는 `--no-ff`** (병합 커밋을 남겨 이력에서 작업 단위를 보존한다).
- PR 의 base 는 항상 `develop`.

## 6. 출시

```
1. develop → main  으로 --no-ff 머지 (PR)
2. main 에서 태그: git tag v1.0.0 && git push origin v1.0.0
```

- 태그는 `vMAJOR.MINOR.PATCH` 형식(예: `v1.0.0`).
- main 에는 출시 시점에만 코드가 올라간다.
