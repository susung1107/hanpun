import { useState } from 'react';

/**
 * 눌림(pressed) 상태 훅.
 *
 * NativeWind(jsxImportSource) 아래에서는 함수형 `style={({ pressed }) => ...}` 가
 * 통째로 무시돼 위치·크기·색이 렌더되지 않는다. 그래서 눌림 피드백은
 * **정적 `style` + 이 훅**으로 처리한다 (프로젝트 표준 패턴).
 *
 * ```tsx
 * const { pressed, pressHandlers } = usePressed();
 * <Pressable {...pressHandlers} style={{ opacity: pressed ? 0.7 : 1 }} />
 * ```
 */
export function usePressed() {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    pressHandlers: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
    },
  };
}
