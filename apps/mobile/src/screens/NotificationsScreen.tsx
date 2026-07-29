import type { AppNotification } from '@hanpun/shared';
import { formatTimeKo, WEEKDAY_KO } from '@hanpun/shared';
import type { LucideIcon } from 'lucide-react-native';
import { Bell, BellOff, CircleAlert, Repeat } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  EmptyState,
  ListCard,
  Screen,
  ScreenHeader,
  SectionLabel,
  Skeleton,
  SkeletonCard,
} from '../components';
import { useMarkNotificationsRead, useNotifications } from '../hooks/useNotifications';
import { useAppNavigation } from '../navigation/hooks';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

interface KindStyle {
  icon: LucideIcon;
  tint: string;
  tintDark: string;
  color: string;
  colorDark: string;
}

/** 알림 종류별 아이콘 배지 (디자인 notifications) */
const KIND_STYLE: Record<AppNotification['kind'], KindStyle> = {
  budget100: {
    icon: CircleAlert,
    tint: '#fdeaea',
    tintDark: '#361f21',
    color: '#d03b3b',
    colorDark: '#e2635f',
  },
  budget80: {
    icon: CircleAlert,
    tint: '#fdf2d7',
    tintDark: '#332a12',
    color: '#c9930f',
    colorDark: '#e0b33f',
  },
  reminder: {
    icon: Bell,
    tint: palette.orange50,
    tintDark: '#3a271d',
    color: palette.orange600,
    colorDark: palette.orange400,
  },
  recurring: {
    icon: Repeat,
    tint: '#e8f0fc',
    tintDark: '#1e2a3c',
    color: '#4a7fd6',
    colorDark: '#7ea9e8',
  },
  notice: {
    icon: Bell,
    tint: '#efeeea',
    tintDark: '#2a2926',
    color: '#85837a',
    colorDark: '#adaba2',
  },
};

/** 알림 (디자인 notifications) */
export function NotificationsScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const rows = useMemo(() => data ?? [], [data]);
  const hasUnread = rows.some(row => !row.read);

  // 화면을 벗어날 때 읽음 처리 — 들어온 즉시 점이 사라지면 무엇이 새 알림인지 알 수 없다
  const pending = useRef(false);
  pending.current = hasUnread;
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  useEffect(
    () => () => {
      if (pending.current) {
        markReadRef.current.mutate();
      }
    },
    [],
  );

  const sections = useMemo(() => groupByRecency(rows), [rows]);

  // 로딩 중(data === undefined)에는 골격을 그린다. 데이터가 도착한 뒤의 빈 배열만
  // "아직 받은 알림이 없어요" 빈 상태로 취급한다 — 구분하지 않으면 첫 진입에서
  // 항상 빈 상태가 잠깐 깜빡인다.
  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="알림" onBack={navigation.goBack} />
        <NotificationsSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="알림"
        onBack={navigation.goBack}
        right={
          hasUnread ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => markRead.mutate()}
              hitSlop={8}>
              <Text className="text-[12px] text-ink-3 dark:text-ink-dark-3">모두 읽음</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        {rows.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="아직 받은 알림이 없어요"
            description={'예산 도달 · 입력 리마인더 알림이\n여기에 모여요'}
            tone="neutral"
          />
        ) : (
          <>
            {sections.map(section => (
              <View key={section.title}>
                <SectionLabel title={section.title} />
                <ListCard className="px-[16px]">
                  {section.items.map(item => (
                    <NotificationRow key={item.id} item={item} />
                  ))}
                </ListCard>
              </View>
            ))}

            <Text
              className="mt-[16px] text-center text-[12px]"
              style={{ color: tokens.ink3 }}>
              알림은 30일간 보관돼요
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/** 알림 화면 로딩 골격 — 알림 행 6줄 (아이콘 배지 + 제목/본문 + 시간) */
function NotificationsSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
      style={{ paddingHorizontal: 18, paddingTop: 8 }}>
      <Skeleton width="25%" height={13} style={{ marginTop: 8, marginBottom: 10 }} />
      <SkeletonCard>
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} className="flex-row items-start gap-[10px] py-[14px]">
            <Skeleton width={34} height={34} radius={11} />
            <View className="flex-1 gap-[7px]">
              <Skeleton width="55%" height={13} />
              <Skeleton width="80%" height={11} />
              <Skeleton width={40} height={10} />
            </View>
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

function NotificationRow({ item }: { item: AppNotification }) {
  const { tokens, isDark } = useTheme();
  const style = KIND_STYLE[item.kind] ?? KIND_STYLE.notice;
  const Icon = style.icon;

  return (
    <View className="flex-row items-start gap-[10px] py-[14px]">
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          marginTop: 15,
          backgroundColor: item.read ? 'transparent' : palette.orange500,
        }}
      />
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? style.tintDark : style.tint,
        }}>
        <Icon size={17} strokeWidth={1.9} color={isDark ? style.colorDark : style.color} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-ink dark:text-ink-dark">{item.title}</Text>
        <Text
          className="mt-[3px] text-[12.5px] text-ink-2 dark:text-ink-dark-2"
          style={{ lineHeight: 19 }}>
          {item.body}
        </Text>
        <Text className="mt-[5px] text-[11px]" style={{ color: tokens.ink3 }}>
          {formatStamp(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

interface Section {
  title: string;
  items: AppNotification[];
}

/** 오늘 / 이번 주 / 이전 으로 묶는다 (디자인 notifications) */
function groupByRecency(rows: AppNotification[]): Section[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const buckets: Section[] = [
    { title: '오늘', items: [] },
    { title: '이번 주', items: [] },
    { title: '이전', items: [] },
  ];

  [...rows]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach(row => {
      const created = new Date(row.createdAt);
      if (created >= today) {
        buckets[0]?.items.push(row);
      } else if (created >= weekAgo) {
        buckets[1]?.items.push(row);
      } else {
        buckets[2]?.items.push(row);
      }
    });

  return buckets.filter(bucket => bucket.items.length > 0);
}

/** 오늘이면 '오후 9:00', 아니면 '7. 19 (일)' */
function formatStamp(iso: string): string {
  const created = new Date(iso);
  const today = new Date();
  const sameDay =
    created.getFullYear() === today.getFullYear() &&
    created.getMonth() === today.getMonth() &&
    created.getDate() === today.getDate();

  if (sameDay) {
    return formatTimeKo(iso);
  }
  return `${created.getMonth() + 1}. ${created.getDate()} (${WEEKDAY_KO[created.getDay()]})`;
}
