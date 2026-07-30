/**
 * 토스트 알림 버스.
 *
 * 실패는 전역 MutationCache 가 한 번에 처리한다(lib/queryClient.ts). 성공은 그럴 수 없다 —
 * 문구가 동작마다 다르고, 예산 저장처럼 뮤테이션을 여러 번 부르는 화면은 사용자가 한 일
 * 한 번당 한 번만 알려야 하기 때문이다. 그래서 성공 알림은 "사용자가 한 일이 끝난 지점"
 * 에서 직접 부른다.
 *
 * 훅이 아니라 모듈 함수로 둔 이유: 뮤테이션 훅을 안 쓰고 API 를 직접 부르는 곳
 * (AccountScreen 등)에서도 똑같이 부를 수 있어야 한다.
 */
export interface ToastMessage {
  /** 같은 문구를 연달아 띄워도 새 알림으로 인식시키는 일련번호 */
  id: number;
  text: string;
}

type Listener = (message: ToastMessage) => void;

let listener: Listener | null = null;
let sequence = 0;

/** ToastHost 전용. 화면에 하나만 떠야 하므로 구독자도 하나만 둔다. */
export function subscribeToast(next: Listener | null): void {
  listener = next;
}

/** 사용자의 동작이 성공으로 끝난 지점에서 부른다. */
export function showToast(text: string): void {
  sequence += 1;
  listener?.({ id: sequence, text });
}
