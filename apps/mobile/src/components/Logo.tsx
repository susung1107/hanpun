import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface Props {
  /** 마스코트 크기 */
  size?: number;
}

/**
 * 한푼 마스코트 (스플래시 온보딩 앱 잠금 공용 자산).
 * 엽전을 닮은 둥근 얼굴 + 반짝임. 디자인 「로고」 카드의 SVG 를 RN 으로 옮긴 것.
 */
export function LogoMark({ size = 96 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <RadialGradient id="face" cx="42%" cy="34%" r="72%">
          <Stop offset="0%" stopColor="#fffefb" />
          <Stop offset="62%" stopColor="#f8f0e1" />
          <Stop offset="100%" stopColor="#e6d8c0" />
        </RadialGradient>
      </Defs>
      {/* 그림자 */}
      <Ellipse cx="48" cy="83" rx="24" ry="5" fill="rgba(0,0,0,0.10)" />
      {/* 귀 */}
      <Circle cx="24" cy="30" r="9" fill="#f0e4cd" />
      <Circle cx="72" cy="30" r="9" fill="#f0e4cd" />
      {/* 얼굴 */}
      <Circle cx="48" cy="47" r="29" fill="url(#face)" />
      {/* 엽전 구멍(사각) */}
      <Path
        d="M41 40h14v14H41z"
        fill="none"
        stroke="#d9c8a8"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* 눈 */}
      <Circle cx="39" cy="45" r="2.6" fill="#3a3226" />
      <Circle cx="57" cy="45" r="2.6" fill="#3a3226" />
      {/* 미소 */}
      <Path
        d="M42 57c2.4 2.4 9.2 2.4 12 0"
        fill="none"
        stroke="#3a3226"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* 반짝임 */}
      <Path
        d="M79 18l1.8 4.6L85 24l-4.2 1.4L79 30l-1.8-4.6L73 24l4.2-1.4z"
        fill="#ffffff"
        opacity={0.92}
      />
      <Path
        d="M17 58l1.2 3.2L21 62l-2.8 1-1.2 3.2L15.8 63 13 62l2.8-.8z"
        fill="#ffffff"
        opacity={0.7}
      />
    </Svg>
  );
}

interface BadgeProps {
  /** 배지(라운드 사각) 크기 */
  size?: number;
  radius?: number;
}

/** 그라디언트 배지 안에 마스코트를 넣은 앱 아이콘 형태 */
export function LogoBadge({ size = 88, radius = 26 }: BadgeProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#eb6834',
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#f28551" />
            <Stop offset="55%" stopColor="#eb6834" />
            <Stop offset="100%" stopColor="#d95926" />
          </LinearGradient>
        </Defs>
        <Path d={`M0 0h${size}v${size}H0z`} fill="url(#badge)" />
      </Svg>
      <LogoMark size={Math.round(size * 0.66)} />
    </View>
  );
}
