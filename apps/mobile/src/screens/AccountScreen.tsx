import { LogOut, RefreshCw, Trash2, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { deleteAccount } from '../api/auth';
import {
  Card,
  ConfirmDialog,
  ListRow,
  Screen,
  ScreenHeader,
  SectionLabel,
} from '../components';
import { useAppNavigation } from '../navigation/hooks';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';

const PROVIDER_META: Record<string, { label: string; mark: string; bg: string; fg: string }> = {
  kakao: { label: '카카오', mark: 'K', bg: '#FEE500', fg: '#191919' },
  google: { label: '구글', mark: 'G', bg: '#ffffff', fg: '#4285F4' },
  apple: { label: 'Apple', mark: 'A', bg: '#111111', fg: '#ffffff' },
  dev: { label: '개발 계정', mark: 'D', bg: '#efeeea', fg: '#85837a' },
};

/** 계정 관리 (디자인 account) */
export function AccountScreen() {
  const navigation = useAppNavigation();
  const { tokens } = useTheme();
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  const [dialog, setDialog] = useState<'signOut' | 'delete' | null>(null);
  const [working, setWorking] = useState(false);

  const provider = PROVIDER_META[user?.provider ?? 'dev'] ?? PROVIDER_META.dev!;

  const onDeleteAccount = async () => {
    setWorking(true);
    try {
      await deleteAccount();
      signOut();
    } catch (error) {
      // 뮤테이션 훅이 아니라 직접 호출이므로 전역 MutationCache 알림이 닿지 않는다.
      // 탈퇴가 실패했는데 조용히 다이얼로그만 닫히면 탈퇴된 줄 알게 된다.
      Alert.alert(
        '탈퇴하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setWorking(false);
      setDialog(null);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="계정 관리" onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <Card padded={false} className="items-center px-[16px] py-[18px]">
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tokens.accentTint,
            }}>
            <User size={28} strokeWidth={1.8} color={tokens.accentText} />
          </View>
          <Text className="mt-[10px] text-title2 font-bold text-ink dark:text-ink-dark">
            {user?.nickname ?? '한푼 사용자'}
          </Text>
          <Text className="mt-[3px] text-[12.5px] text-ink-2 dark:text-ink-dark-2">
            {user?.email ?? '-'}
          </Text>
        </Card>

        <SectionLabel title="연결된 계정" />
        <Card padded={false} className="px-[16px]">
          {/* 소셜 배지는 아이콘이 아니라 브랜드 색 + 글자이므로 ListRow 대신 직접 그린다 */}
          <View className="flex-row items-center gap-[12px] py-[13px]">
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: provider.bg,
                borderWidth: provider.bg === '#ffffff' ? 1 : 0,
                borderColor: tokens.line,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: provider.fg }}>
                {provider.mark}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14.5px] font-semibold text-ink dark:text-ink-dark">
                {provider.label}
              </Text>
              <Text className="mt-[2px] text-[12px] text-ink-2 dark:text-ink-dark-2">
                로그인에 사용 중
              </Text>
            </View>
            <Text className="text-[12.5px] font-semibold" style={{ color: tokens.good }}>
              연결됨
            </Text>
          </View>
        </Card>

        <SectionLabel title="데이터" />
        <Card padded={false} className="px-[16px]">
          <ListRow
            icon={RefreshCw}
            title="서버 자동 저장"
            description="모든 기록은 입력 즉시 안전하게 보관돼요"
            value="켜짐"
            valueTone="good"
            divider={false}
          />
        </Card>

        <View className="mt-[20px]">
          <Card padded={false} className="px-[16px]">
            <ListRow
              icon={LogOut}
              title="로그아웃"
              chevron
              onPress={() => setDialog('signOut')}
            />
            <ListRow
              icon={Trash2}
              iconTint={tokens.criticalTint}
              iconColor={tokens.critical}
              title="회원 탈퇴"
              description="모든 데이터가 서버에서 즉시 삭제돼요"
              chevron
              danger
              divider={false}
              onPress={() => setDialog('delete')}
            />
          </Card>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={dialog === 'signOut'}
        onClose={() => setDialog(null)}
        icon={LogOut}
        tone="neutral"
        title="로그아웃할까요?"
        message={'기록은 서버에 그대로 있어요.\n다시 로그인하면 이어서 쓸 수 있어요.'}
        confirmLabel="로그아웃"
        onConfirm={signOut}
      />

      <ConfirmDialog
        visible={dialog === 'delete'}
        onClose={() => setDialog(null)}
        icon={Trash2}
        tone="danger"
        title="정말 탈퇴할까요?"
        message={'모든 거래·예산·반복 기록이 즉시 삭제되고\n되돌릴 수 없어요.'}
        confirmLabel="탈퇴"
        onConfirm={onDeleteAccount}
        loading={working}
      />
    </Screen>
  );
}
