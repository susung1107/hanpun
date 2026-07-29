import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
  RadialGradient,
} from 'react-native-svg';

/**
 * 한푼 정본 로고 — 엽전 틸트 (A-3 정제).
 * 디자인 원본: design/foundations/logo.html · 벡터 원본: assets/logo.svg · assets/logo-dark.svg
 *
 * 이 파일은 스플래시 PNG(react-native-bootsplash)·앱 아이콘과 **같은 벡터**를 쓴다.
 * 셋 중 하나만 고치면 세 자리에서 로고가 달라 보이므로 assets/*.svg 와 항상 함께 고친다.
 *
 * 디자인 원본의 흐림(feGaussianBlur)은 옮기지 않았다 — react-native-svg 의 필터는
 * Android 에서 렌더가 불안정하고, 96px 이하에서는 흐림 유무가 눈에 띄지 않는다.
 * 대신 같은 요소를 낮은 불투명도로 그려 인상을 맞춘다.
 */

/** 30px 이하에서는 두께·각인을 생략한 단순형으로 자동 대체 (디자인 「사이즈 스케일」 규격) */
const SIMPLE_BELOW = 30;

type Face = 'cream' | 'orange';

interface Props {
  /** 마크 크기 */
  size?: number;
  /**
   * 면 색. 주황 배경 위에는 `cream`(기본), 거의 검은 배경 위에는 `orange`.
   * 크림 면은 다크 배경에서 눈부시다.
   */
  face?: Face;
}

const FACE_STOPS: Record<Face, { face: [string, string, string]; edge: [string, string] }> = {
  cream: { face: ['#fffefb', '#f8f0e1', '#e6d8c0'], edge: ['#d3c1a4', '#b9a583'] },
  orange: { face: ['#ffb183', '#f28551', '#d95d26'], edge: ['#b04a17', '#8f3a10'] },
};

const RIM = { cream: '#b06a3a', orange: '#7e3007' } as const;
const RIM_OPACITY = { cream: 0.3, orange: 0.35 } as const;
const GLINT = { cream: '#ffffff', orange: '#ffd9c2' } as const;
const HOLE_SHADOW = { cream: '#6e2a08', orange: '#000000' } as const;
const SPARKLE = { cream: '#ffffff', orange: '#ffe4d4' } as const;

export function LogoMark({ size = 96, face = 'cream' }: Props) {
  // 같은 화면에 두 마크가 뜨면 gradient id 가 충돌하므로 면 색으로 갈라 둔다.
  const uid = `hp-${face}`;

  if (size <= SIMPLE_BELOW) {
    return (
      <Svg width={size} height={size} viewBox="0 0 52 52">
        <Defs>
          <Mask id={`${uid}-hole-s`} maskUnits="userSpaceOnUse" x="0" y="0" width="52" height="52">
            <Rect width="52" height="52" fill="#fff" />
            <Rect x="20.7" y="20" width="10.6" height="10.6" rx="2.5" fill="#000" />
          </Mask>
        </Defs>
        <G transform="rotate(-8 26 26)" mask={`url(#${uid}-hole-s)`}>
          <Circle cx="26" cy="26" r="21.5" fill={face === 'cream' ? '#ffffff' : '#f28551'} />
        </G>
      </Svg>
    );
  }

  const stops = FACE_STOPS[face];

  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      <Defs>
        <RadialGradient id={`${uid}-face`} cx="36%" cy="28%" r="100%">
          <Stop offset="0" stopColor={stops.face[0]} />
          <Stop offset="0.55" stopColor={stops.face[1]} />
          <Stop offset="1" stopColor={stops.face[2]} />
        </RadialGradient>
        <LinearGradient id={`${uid}-edge`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stops.edge[0]} />
          <Stop offset="1" stopColor={stops.edge[1]} />
        </LinearGradient>
        <Mask id={`${uid}-hole`} maskUnits="userSpaceOnUse" x="0" y="0" width="52" height="52">
          <Rect width="52" height="52" fill="#fff" />
          <Rect x="20.7" y="20" width="10.6" height="10.6" rx="2.5" fill="#000" />
        </Mask>
        <ClipPath id={`${uid}-holeclip`}>
          <Rect x="20.7" y="20" width="10.6" height="10.6" rx="2.5" />
        </ClipPath>
      </Defs>

      <G transform="rotate(-8 26 26)">
        <G mask={`url(#${uid}-hole)`}>
          {/* 동전 두께 — 면을 2px 위로 올려 아래쪽만 단면이 보이게 한다 */}
          <Circle cx="26" cy="27.2" r="21.3" fill={`url(#${uid}-edge)`} />
          <Circle cx="26" cy="25.2" r="21.3" fill={`url(#${uid}-face)`} />
          <Circle
            cx="26"
            cy="25.2"
            r="17"
            fill="none"
            stroke={RIM[face]}
            strokeWidth={1.5}
            opacity={RIM_OPACITY[face]}
          />
          <Path
            d="M11.6 16.5 A17.5 17.5 0 0 1 22.5 6.9"
            fill="none"
            stroke={GLINT[face]}
            strokeWidth={3.2}
            strokeLinecap="round"
            opacity={face === 'cream' ? 0.55 : 0.5}
          />
        </G>

        {/* 구멍 위쪽 안쪽 그림자 — 구멍이 뚫려 보이게 하는 유일한 단서라 생략하지 않는다 */}
        <G clipPath={`url(#${uid}-holeclip)`}>
          <Rect
            x="20.7"
            y="20"
            width="10.6"
            height="2.4"
            fill={HOLE_SHADOW[face]}
            opacity={face === 'cream' ? 0.28 : 0.3}
          />
        </G>

        <Path
          d="M40.5 9.6 l1.1 2.5 2.5 1.1 -2.5 1.1 -1.1 2.5 -1.1 -2.5 -2.5 -1.1 2.5 -1.1z"
          fill={SPARKLE[face]}
          opacity={0.95}
        />
      </G>
    </Svg>
  );
}

interface BadgeProps {
  /** 배지(라운드 사각) 크기 */
  size?: number;
  radius?: number;
}

/**
 * 앱 아이콘 형태 — 주황 그라데이션 배지 안의 엽전.
 * 온보딩·앱 잠금·스플래시에서 이걸 쓴다. 주황 사각형을 화면마다 새로 만들지 말 것.
 */
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
          <LinearGradient id="hp-badge" x1="0" y1="0" x2="0.52" y2="1">
            <Stop offset="0" stopColor="#f28551" />
            <Stop offset="0.55" stopColor="#eb6834" />
            <Stop offset="1" stopColor="#d95926" />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#hp-badge)" />
      </Svg>
      {/* 디자인 「사이즈 스케일」 — 배지 대비 마크는 64% */}
      <LogoMark size={Math.round(size * 0.64)} />
    </View>
  );
}
