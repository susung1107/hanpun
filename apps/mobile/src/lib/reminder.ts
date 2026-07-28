import notifee, { AndroidImportance, RepeatFrequency, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';

/**
 * 매일 저녁 입력 리마인더 (기획 확정: 기본 21:00, 이미 입력한 날은 건너뜀).
 *
 * Notifee 의 반복 트리거로 매일 같은 시각에 로컬 알림을 예약한다.
 * "오늘 입력했으면 건너뜀" 판정은 알림을 띄우기 전에 앱이 할 수 없으므로,
 * 앱 포그라운드 진입 시점에 오늘 기록 유무를 확인해 다음 예약을 취소/재예약한다.
 */

const REMINDER_ID = 'hanpun-daily-reminder';
const CHANNEL_ID = 'hanpun-reminder';

async function ensureChannel(): Promise<string> {
  if (Platform.OS !== 'android') {
    return CHANNEL_ID;
  }
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: '입력 리마인더',
    importance: AndroidImportance.DEFAULT,
  });
}

/** 알림 권한 요청 — 온보딩 이후 첫 홈 진입에서 호출 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

/** 'HH:mm' 문자열로 다음 알림 시각을 계산 */
function nextTriggerAt(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hour ?? 21, minute ?? 0, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/** 리마인더 예약 (기존 예약은 대체된다) */
export async function scheduleDailyReminder(time: string): Promise<void> {
  const channelId = await ensureChannel();
  await notifee.createTriggerNotification(
    {
      id: REMINDER_ID,
      title: '오늘 지출 기록했나요?',
      body: '하루 1분, 한푼이면 충분해요.',
      android: { channelId, pressAction: { id: 'default' } },
      ios: { sound: 'default' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: nextTriggerAt(time).getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
}

export async function cancelDailyReminder(): Promise<void> {
  await notifee.cancelTriggerNotification(REMINDER_ID);
}

/**
 * 설정과 오늘 기록 여부를 반영해 리마인더 상태를 맞춘다.
 * - 리마인더 꺼짐 → 취소
 * - 오늘 이미 입력함 → 오늘 것은 건너뛰고 내일로 재예약
 */
export async function syncReminder(options: {
  enabled: boolean;
  time: string;
  hasTodayRecord: boolean;
}): Promise<void> {
  if (!options.enabled) {
    await cancelDailyReminder();
    return;
  }
  if (options.hasTodayRecord) {
    const [hour, minute] = options.time.split(':').map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour ?? 21, minute ?? 0, 0, 0);
    const channelId = await ensureChannel();
    await notifee.createTriggerNotification(
      {
        id: REMINDER_ID,
        title: '오늘 지출 기록했나요?',
        body: '하루 1분, 한푼이면 충분해요.',
        android: { channelId, pressAction: { id: 'default' } },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: tomorrow.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
    return;
  }
  await scheduleDailyReminder(options.time);
}
