import {
  formatDateWithWeekday,
  formatSignedAmount,
  formatTimeKo,
  getCategoryLabel,
} from '@hanpun/shared';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import {
  Calendar,
  Pencil,
  Repeat,
  SearchX,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Button,
  Card,
  CategoryIcon,
  ConfirmDialog,
  EmptyState,
  Screen,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
} from '../components';
import { usePersonalRules } from '../hooks/useClassification';
import { useDeleteTransaction, useTransaction } from '../hooks/useTransactions';
import { suggestCategory } from '../lib/classify';
import { showToast } from '../lib/toast';
import { useAppNavigation } from '../navigation/hooks';
import type { RootStackParamList } from '../navigation/types';
import { cx } from '../theme/classes';
import { useTheme } from '../theme/ThemeProvider';

/** 거래 상세 (디자인 transaction-detail + delete-dialog) */
export function TransactionDetailScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetail'>>();
  const { tokens } = useTheme();
  const { id } = route.params;

  const { data: transaction, isLoading, isError, error } = useTransaction(id);
  const { data: rules } = usePersonalRules();
  const remove = useDeleteTransaction();
  const [confirming, setConfirming] = useState(false);

  // 이미 삭제된 거래로 들어오면 무한 스피너가 되므로 실패 상태를 따로 그린다
  if (isError || (!isLoading && !transaction)) {
    return (
      <Screen>
        <ScreenHeader title="거래 상세" onBack={navigation.goBack} />
        <EmptyState
          icon={SearchX}
          title="내역을 불러올 수 없어요"
          description={
            error instanceof Error ? error.message : '이미 삭제된 내역일 수 있어요'
          }
          tone="neutral"
          paddingTop={80}
        />
      </Screen>
    );
  }

  if (isLoading || !transaction) {
    return (
      <Screen>
        <ScreenHeader title="거래 상세" onBack={navigation.goBack} />
        <DetailSkeleton />
      </Screen>
    );
  }

  const suggestion = suggestCategory(transaction.title, transaction.type, rules ?? []);
  const autoClassified =
    suggestion.source !== 'fallback' && suggestion.categoryId === transaction.categoryId;

  const cycleText = transaction.recurringRuleId ? '반복거래에서 자동 생성' : '없음 (1회성)';

  const onDelete = async () => {
    try {
      await remove.mutateAsync(transaction.id);
    } catch {
      // 실패 알림은 전역 MutationCache 가 띄운다. 다이얼로그만 닫고 화면은 유지한다.
      setConfirming(false);
      return;
    }
    setConfirming(false);
    showToast('내역을 삭제했어요');
    navigation.goBack();
  };

  return (
    <Screen>
      <ScreenHeader
        title="거래 상세"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="삭제"
            onPress={() => setConfirming(true)}
            hitSlop={8}>
            <Trash2 size={19} strokeWidth={1.9} color={tokens.critical} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View className="items-center pb-[6px] pt-[18px]">
          <CategoryIcon categoryId={transaction.categoryId} size={56} iconSize={26} radius={18} />
          <Text className={`${cx.title2} mt-[12px]`}>
            {transaction.title}
          </Text>
          <Text
            className="mt-[6px] text-[30px] font-bold"
            style={{
              color: transaction.type === 'income' ? tokens.accentText : tokens.ink,
            }}>
            {formatSignedAmount(transaction.amount, transaction.type)}
          </Text>
        </View>

        <Card padded={false} className="mt-[10px] px-[16px]">
          <DetailRow
            icon={Tag}
            label="카테고리"
            value={getCategoryLabel(transaction.categoryId)}
            onPress={() => navigation.navigate('TransactionEdit', { id: transaction.id })}
          />
          <DetailRow
            icon={Calendar}
            label="날짜"
            value={`${formatDateWithWeekday(transaction.occurredAt)} ${formatTimeKo(
              transaction.occurredAt,
            )}`}
          />
          <DetailRow icon={Repeat} label="반복" value={cycleText} />
          <DetailRow
            icon={Pencil}
            label="메모"
            value={transaction.memo?.trim() ? transaction.memo : '없음'}
            last
          />
        </Card>

        {autoClassified ? (
          <View
            className="mt-[12px] rounded-chip border px-[14px] py-[10px]"
            style={{
              backgroundColor: tokens.bannerBg,
              borderColor: tokens.bannerBorder,
            }}>
            <Text className="text-[12.5px] text-ink-2 dark:text-ink-dark-2" style={{ lineHeight: 19 }}>
              {`✦ 자동 분류된 내역이에요 · 카테고리를 바꾸면 다음 "${transaction.title}" 부터 반영돼요`}
            </Text>
          </View>
        ) : null}

        <View className="mb-[28px] mt-[16px]">
          <Button
            label="수정하기"
            variant="secondary"
            onPress={() => navigation.navigate('TransactionEdit', { id: transaction.id })}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        onClose={() => setConfirming(false)}
        icon={Trash2}
        tone="danger"
        title="이 내역을 삭제할까요?"
        message={`${transaction.title} ${formatSignedAmount(transaction.amount, transaction.type)}\n삭제한 내역은 되돌릴 수 없어요`}
        confirmLabel="삭제"
        onConfirm={onDelete}
        loading={remove.isPending}
      />
    </Screen>
  );
}

interface RowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}

function DetailRow({ icon: Icon, label, value, onPress, last = false }: RowProps) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-[12px] py-[13px] ${
        last ? '' : 'border-b border-line dark:border-line-dark'
      } ${onPress ? 'active:opacity-60' : ''}`}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.neutralTint,
        }}>
        <Icon size={17} strokeWidth={1.9} color={tokens.ink2} />
      </View>
      <Text className="w-[62px] text-[13px] text-ink-3 dark:text-ink-dark-3">{label}</Text>
      <Text className="flex-1 text-right text-[13.5px] font-medium text-ink dark:text-ink-dark">
        {value}
      </Text>
    </Pressable>
  );
}

/** 로딩 중 상세 골격 — 상단 아이콘/제목/금액, 정보 카드 4행, 수정 버튼 */
function DetailSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="불러오는 중"
      style={{ paddingHorizontal: 20 }}>
      <View className="items-center pb-[6px] pt-[18px]">
        <Skeleton width={56} height={56} radius={18} />
        <Skeleton width="40%" height={18} radius={9} style={{ marginTop: 12 }} />
        <Skeleton width="60%" height={34} radius={10} style={{ marginTop: 8 }} />
      </View>

      <SkeletonCard style={{ marginTop: 10 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <DetailRowSkeleton key={index} last={index === 3} />
        ))}
      </SkeletonCard>

      <View style={{ marginTop: 16, marginBottom: 28 }}>
        <Skeleton height={46} radius={14} />
      </View>
    </View>
  );
}

/** DetailRow 골격 — 아이콘 · 라벨(좌) · 값(우) · 구분선 */
function DetailRowSkeleton({ last }: { last: boolean }) {
  const { tokens } = useTheme();
  return (
    <View
      className="flex-row items-center gap-[12px] py-[13px]"
      style={last ? null : { borderBottomWidth: 1, borderBottomColor: tokens.line }}>
      <Skeleton width={34} height={34} radius={10} />
      <Skeleton width={44} height={13} />
      <View className="flex-1 items-end">
        <Skeleton width="50%" height={13} />
      </View>
    </View>
  );
}
