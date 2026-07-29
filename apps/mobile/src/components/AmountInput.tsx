import { formatNumber, parseAmountInput } from '@hanpun/shared';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

/** 숫자가 바뀔 때 살짝 커졌다 돌아오는 정도 — 이보다 크면 장난스러워진다 */
const POP_SCALE = 1.045;
const POP_UP_MS = 90;
const POP_DOWN_MS = 140;

interface Props {
  /** 원 단위 정수 (0 이면 빈 입력으로 표시) */
  value: number;
  onChange: (value: number) => void;
  label?: string;
  autoFocus?: boolean;
  /** 수입 입력은 테두리·숫자를 good(초록)으로 (디자인 add-income) */
  tone?: 'expense' | 'income';
}

/**
 * 금액 입력 카드 (디자인 「입력」 카드).
 * radius 16 / 1.5px orange-500 테두리 / 우측 정렬 32px·700 / '원' 접미사 20px ink-2
 */
export function AmountInput({
  value,
  onChange,
  label = '금액',
  autoFocus = true,
  tone = 'expense',
}: Props) {
  const { tokens } = useTheme();
  const text = value > 0 ? formatNumber(value) : '';
  const accent = tone === 'income' ? tokens.good : palette.orange500;

  /**
   * 숫자를 한 자 누를 때마다 금액이 아주 살짝 커졌다 돌아온다.
   *
   * 숫자 키패드는 눌러도 화면이 거의 안 변해서 — 자리 하나가 늘 뿐이라 —
   * 제대로 입력됐는지 확신이 안 든다. 이 반동이 "받았다" 는 신호 역할을 한다.
   *
   * 기준점은 오른쪽 가운데다. 가운데에서 키우면 우측 정렬된 숫자가 옆으로
   * 흔들려 오히려 읽기 불편해진다.
   */
  const pop = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  useEffect(() => {
    const grew = value > previous.current;
    previous.current = value;
    // 지울 때는 반동을 주지 않는다 — 지우기는 되돌리는 동작이라 강조할 게 없다
    if (!grew) {
      return;
    }
    const animation = Animated.sequence([
      Animated.timing(pop, {
        toValue: POP_SCALE,
        duration: POP_UP_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: POP_DOWN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [value, pop]);

  return (
    <View
      className="rounded-card border-[1.5px] bg-surface px-[16px] pb-[14px] pt-[12px] dark:bg-surface-dark"
      style={{ borderColor: accent }}>
      <Text className="text-[12px] text-ink-3 dark:text-ink-dark-3">{label}</Text>
      <Animated.View
        className="mt-[4px] flex-row items-end justify-end"
        style={{ transform: [{ scale: pop }], transformOrigin: 'right center' }}>
        <TextInput
          value={text}
          onChangeText={next => onChange(parseAmountInput(next))}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          placeholder="0"
          placeholderTextColor={tokens.ink3}
          maxLength={13}
          style={{
            flex: 1,
            fontSize: 32,
            fontWeight: '700',
            textAlign: 'right',
            color: tone === 'income' ? tokens.good : tokens.ink,
            padding: 0,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text
          className="ml-[6px] text-[20px] font-medium text-ink-2 dark:text-ink-dark-2"
          style={{ lineHeight: 34 }}>
          원
        </Text>
      </Animated.View>
    </View>
  );
}
