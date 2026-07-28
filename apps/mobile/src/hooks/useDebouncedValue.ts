import { useEffect, useState } from 'react';

/**
 * 입력이 멈춘 뒤에만 값을 넘긴다.
 * 검색창처럼 타이핑 한 글자마다 요청이 나가면 안 되는 곳에서 쓴다.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
