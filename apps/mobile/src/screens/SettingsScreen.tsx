import { formatBudgetWon } from '@hanpun/shared';
import {
  Bell,
  Check,
  CircleAlert,
  FileText,
  Lock,
  Moon,
  MonitorSmartphone,
  Repeat,
  Scale,
  Sun,
  User,
  Wallet,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  BottomSheet,
  ListCard,
  ListRow,
  Screen,
  SectionLabel,
  TabHeader,
} from '../components';
import { useBudgets } from '../hooks/useBudgets';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import { useRecurringRules } from '../hooks/useRecurring';
import { describeBiometry, getBiometryKind, type BiometryKind } from '../lib/biometrics';
import { cancelDailyReminder, scheduleDailyReminder } from '../lib/reminder';
import { useAppNavigation } from '../navigation/hooks';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, type ThemeMode } from '../store/settingsStore';
import { useTheme } from '../theme/ThemeProvider';

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; title: string; description: string }[] = [
  {
    mode: 'system',
    icon: MonitorSmartphone,
    title: '시스템 설정 따름',
    description: '기기 설정에 맞춰 자동 전환',
  },
  { mode: 'light', icon: Sun, title: '라이트', description: '항상 밝은 테마' },
  { mode: 'dark', icon: Moon, title: '다크', description: '항상 어두운 테마' },
];

const THEME_LABEL: Record<ThemeMode, string> = {
  system: '시스템 설정',
  light: '라이트',
  dark: '다크',
};

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오 계정',
  google: '구글 계정',
  apple: 'Apple 계정',
  dev: '개발 계정',
};

/** 설정 (디자인 settings + theme-sheet) */
export function SettingsScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();
  const { month } = useMonthNavigation();

  const user = useAuthStore(state => state.user);
  // 스토어 전체를 구독하면 무관한 설정 하나만 바뀌어도 이 화면이 다시 그려진다
  const {
    themeMode,
    reminderEnabled,
    reminderTime,
    budgetAlertEnabled,
    appLockEnabled,
    setThemeMode,
    setReminderEnabled,
    setBudgetAlertEnabled,
    setAppLockEnabled,
    setBiometricEnabled,
  } = useSettingsStore(
    useShallow(state => ({
      themeMode: state.themeMode,
      reminderEnabled: state.reminderEnabled,
      reminderTime: state.reminderTime,
      budgetAlertEnabled: state.budgetAlertEnabled,
      appLockEnabled: state.appLockEnabled,
      setThemeMode: state.setThemeMode,
      setReminderEnabled: state.setReminderEnabled,
      setBudgetAlertEnabled: state.setBudgetAlertEnabled,
      setAppLockEnabled: state.setAppLockEnabled,
      setBiometricEnabled: state.setBiometricEnabled,
    })),
  );

  const { data: budgets } = useBudgets(month);
  const { data: rules } = useRecurringRules();

  const [themeSheet, setThemeSheet] = useState(false);
  const [biometry, setBiometry] = useState<BiometryKind>('none');

  useEffect(() => {
    getBiometryKind()
      .then(setBiometry)
      .catch(() => setBiometry('none'));
  }, []);

  const totalBudget = (budgets ?? []).find(budget => budget.categoryId === null)?.amount ?? 0;
  const activeRules = (rules ?? []).filter(rule => rule.active).length;

  const onToggleReminder = (next: boolean) => {
    setReminderEnabled(next);
    const task = next ? scheduleDailyReminder(reminderTime) : cancelDailyReminder();
    task.catch(() => {
      /* 권한 거부 등은 무시 — 설정 값만 유지한다 */
    });
  };

  const onToggleAppLock = (next: boolean) => {
    if (next && biometry === 'none') {
      Alert.alert(
        '생체 인증을 사용할 수 없어요',
        '기기에 Face ID · 지문이 등록되어 있어야 앱 잠금을 켤 수 있어요.',
      );
      return;
    }
    setAppLockEnabled(next);
    setBiometricEnabled(next);
  };

  return (
    <Screen edges={{ bottom: false }}>
      <TabHeader title="설정" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <ListCard className="px-[16px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Account')}
            className="flex-row items-center gap-[12px] py-[14px] active:opacity-60">
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.accentTint,
              }}>
              <User size={20} strokeWidth={1.8} color={tokens.accentText} />
            </View>
            <View className="flex-1">
              <Text className="text-[14.5px] font-semibold text-ink dark:text-ink-dark">
                {user?.nickname ?? '한푼 사용자'}
              </Text>
              <Text className="mt-[2px] text-[12px] text-ink-2 dark:text-ink-dark-2">
                {`${PROVIDER_LABEL[user?.provider ?? 'dev'] ?? '계정'} · 서버 자동 저장`}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: tokens.ink3 }}>›</Text>
          </Pressable>
        </ListCard>

        <SectionLabel title="알림" />
        <ListCard className="px-[16px]">
          <ListRow
            icon={Bell}
            title="매일 입력 리마인더"
            description={`저녁 ${formatReminderTime(reminderTime)}`}
            divider={false}
            toggle={{ value: reminderEnabled, onValueChange: onToggleReminder }}
          />
          <ListRow
            icon={CircleAlert}
            title="예산 도달 알림"
            description="80% · 100% 도달 시"
            divider={false}
            toggle={{ value: budgetAlertEnabled, onValueChange: setBudgetAlertEnabled }}
          />
        </ListCard>

        <SectionLabel title="가계부" />
        <ListCard className="px-[16px]">
          <ListRow
            icon={Wallet}
            title="예산 설정"
            value={totalBudget > 0 ? `월 ${formatBudgetWon(totalBudget)}` : '미설정'}
            chevron
            divider={false}
            onPress={() => navigation.navigate('Budget')}
          />
          <ListRow
            icon={Repeat}
            title="반복거래 관리"
            value={`${activeRules}건`}
            chevron
            divider={false}
            onPress={() => navigation.navigate('Recurring')}
          />
        </ListCard>

        <SectionLabel title="화면" />
        <ListCard className="px-[16px]">
          <ListRow
            icon={Moon}
            title="테마"
            value={THEME_LABEL[themeMode]}
            chevron
            divider={false}
            onPress={() => setThemeSheet(true)}
          />
          <ListRow
            icon={Lock}
            title="앱 잠금"
            description={biometry === 'none' ? '사용 불가' : `${describeBiometry(biometry)} 로 해제`}
            divider={false}
            toggle={{ value: appLockEnabled, onValueChange: onToggleAppLock }}
          />
        </ListCard>

        <SectionLabel title="기타" />
        <ListCard className="px-[16px]">
          <ListRow
            icon={FileText}
            title="개인정보처리방침"
            chevron
            divider={false}
            onPress={() => Alert.alert('개인정보처리방침', '출시 전 문서 링크가 연결됩니다.')}
          />
          <ListRow
            icon={Scale}
            title="오픈소스 라이선스"
            chevron
            divider={false}
            onPress={() => Alert.alert('오픈소스 라이선스', '출시 전 목록이 연결됩니다.')}
          />
          {/*
            회원 탈퇴는 여기 두지 않는다 — 계정 관리 화면 안에만 있다.
            돌이킬 수 없는 동작이 설정 목록을 훑다가 눈에 띄는 자리에 있으면
            실수로 누르기 쉽고, 같은 기능이 두 군데 있으면 확인 절차도 갈라진다.
          */}
        </ListCard>

        <Text className="mt-[18px] text-center text-[11.5px]" style={{ color: tokens.ink3 }}>
          한푼 v1.0
        </Text>
      </ScrollView>

      <BottomSheet visible={themeSheet} onClose={() => setThemeSheet(false)} title="테마">
        <View className="pb-[6px]">
          {THEME_OPTIONS.map(option => {
            const Icon = option.icon;
            const selected = themeMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setThemeMode(option.mode);
                  setThemeSheet(false);
                }}
                className="flex-row items-center gap-[12px] py-[12px] active:opacity-60">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: tokens.neutralTint,
                  }}>
                  <Icon size={18} strokeWidth={1.9} color={tokens.ink2} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-[14.5px] text-ink dark:text-ink-dark ${
                      selected ? 'font-bold' : 'font-medium'
                    }`}>
                    {option.title}
                  </Text>
                  <Text className="mt-[2px] text-[12px] text-ink-2 dark:text-ink-dark-2">
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <Check size={20} strokeWidth={2.2} color={tokens.accentText} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </Screen>
  );
}

/** '21:00' → '9:00' */
function formatReminderTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const h = (hour ?? 21) % 12 === 0 ? 12 : (hour ?? 21) % 12;
  return `${h}:${String(minute ?? 0).padStart(2, '0')}`;
}

