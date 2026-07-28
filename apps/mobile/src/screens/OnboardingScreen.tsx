import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LogoBadge } from '../components';
import { devSignIn } from '../api/auth';
import { usePressed } from '../hooks/usePressed';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

type Provider = 'kakao' | 'google' | 'apple';

interface Slide {
  title: string;
  body: string;
}

/** 3장 인트로 (디자인 onboarding 의 페이지 도트 3개) */
const SLIDES: Slide[] = [
  {
    title: '한푼',
    body: '매일 10초, 가장 간단한 가계부.\n쓴 만큼만 적으면 정리는 한푼이 할게요.',
  },
  {
    title: '적으면 알아서 분류',
    body: '"스타벅스" 라고만 적어도 식비로 분류돼요.\n한 번 바꾸면 다음부터 기억할게요.',
  },
  {
    title: '예산은 미리 알려줘요',
    body: '카테고리마다 예산을 정해두면\n80% · 100% 에 도달할 때 먼저 알려드려요.',
  },
];

export function OnboardingScreen() {
  const { width } = Dimensions.get('window');
  const signIn = useAuthStore(state => state.signIn);
  const setOnboarded = useSettingsStore(state => state.setOnboarded);
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<Provider | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== page) {
      setPage(next);
    }
  };

  const start = async (provider: Provider) => {
    if (pending) {
      return;
    }
    setPending(provider);
    try {
      const result = await devSignIn(provider);
      setOnboarded(true);
      signIn({
        user: result.user,
        tokens: { accessToken: result.accessToken, refreshToken: result.refreshToken },
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <View className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.title}
            style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <LogoBadge size={88} radius={26} />
            <Text
              className="mt-[26px] text-center text-[28px] font-bold text-ink dark:text-ink-dark"
              style={{ letterSpacing: -0.6 }}>
              {slide.title}
            </Text>
            <Text
              className="mt-[8px] text-center text-body text-ink-2 dark:text-ink-dark-2"
              style={{ lineHeight: 25 }}>
              {slide.body}
            </Text>
            {index === 0 ? null : null}
          </View>
        ))}
      </ScrollView>

      <View className="mb-[18px] flex-row items-center justify-center gap-[6px]">
        {SLIDES.map((slide, index) => (
          <Pressable
            key={slide.title}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1}번째 소개`}
            onPress={() => scrollRef.current?.scrollTo({ x: index * width, animated: true })}
            hitSlop={8}>
            <View
              style={{
                width: index === page ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === page ? palette.orange500 : '#d9d7d1',
              }}
            />
          </Pressable>
        ))}
      </View>

      <View className="gap-[10px] px-[24px] pb-[40px]">
        <SocialButton
          provider="kakao"
          label="카카오로 시작하기"
          loading={pending === 'kakao'}
          onPress={() => start('kakao')}
        />
        <SocialButton
          provider="google"
          label="구글로 시작하기"
          loading={pending === 'google'}
          onPress={() => start('google')}
        />
        <SocialButton
          provider="apple"
          label="Apple로 시작하기"
          loading={pending === 'apple'}
          onPress={() => start('apple')}
        />
        <Text
          className="mt-[6px] text-center text-[11.5px] text-ink-3 dark:text-ink-dark-3"
          style={{ lineHeight: 17 }}>
          시작하면 <Text className="underline">이용약관</Text> 및{' '}
          <Text className="underline">개인정보처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </View>
  );
}

interface SocialProps {
  provider: Provider;
  label: string;
  loading: boolean;
  onPress: () => void;
}

function SocialButton({ provider, label, loading, onPress }: SocialProps) {
  const { tokens } = useTheme();
  const { pressed, pressHandlers } = usePressed();
  const style = PROVIDER_STYLE[provider];
  const background = provider === 'google' ? tokens.surface : style.background;
  const color = provider === 'google' ? tokens.ink : style.color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: loading }}
      disabled={loading}
      onPress={onPress}
      {...pressHandlers}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: 14,
        paddingVertical: 15,
        backgroundColor: background,
        borderWidth: provider === 'google' ? 1 : 0,
        borderColor: tokens.line,
        opacity: pressed || loading ? 0.75 : 1,
      }}>
      <ProviderMark provider={provider} color={color} />
      <Text style={{ fontSize: 15, fontWeight: '600', color }}>{label}</Text>
    </Pressable>
  );
}

const PROVIDER_STYLE: Record<Provider, { background: string; color: string }> = {
  kakao: { background: '#FEE500', color: '#191919' },
  google: { background: '#ffffff', color: palette.ink },
  apple: { background: '#111111', color: '#ffffff' },
};

/** 각 소셜 브랜드 마크 (아이콘 폰트 없이 SVG/문자로 표현) */
function ProviderMark({ provider, color }: { provider: Provider; color: string }) {
  if (provider === 'kakao') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Path
          d="M9 2.4c-3.7 0-6.7 2.3-6.7 5.2 0 1.9 1.3 3.5 3.2 4.4l-.7 2.6c-.1.3.2.5.4.3l3-2c.3 0 .5.1.8.1 3.7 0 6.7-2.3 6.7-5.4C15.7 4.7 12.7 2.4 9 2.4z"
          fill={color}
        />
      </Svg>
    );
  }
  if (provider === 'google') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Path
          d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"
          fill="#4285F4"
        />
        <Path
          d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"
          fill="#34A853"
        />
        <Path d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" fill="#FBBC05" />
        <Path
          d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
          fill="#EA4335"
        />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M12.3 9.5c0-1.6 1.1-2.5 1.2-2.5-.7-1-1.7-1.1-2.1-1.1-.9-.1-1.8.5-2.2.5-.5 0-1.2-.5-2-.5-1 0-2 .6-2.6 1.6-1.1 1.9-.3 4.7.8 6.2.5.7 1.1 1.5 1.9 1.5.7 0 1-.5 2-.5.9 0 1.2.5 2 .5s1.4-.7 1.9-1.5c.6-.9.8-1.7.8-1.8-.1 0-1.7-.7-1.7-2.4zM10.8 4.6c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.5-.7 1.2-.6 1.8.7.1 1.4-.3 1.8-.8z"
        fill={color}
      />
    </Svg>
  );
}
