import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/**
 * 앱 잠금용 생체 인증 (Face ID / Touch ID / 지문).
 * 실패하거나 미지원 기기면 PIN 입력으로 폴백한다.
 */

const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export type BiometryKind = 'faceId' | 'touchId' | 'fingerprint' | 'none';

export async function getBiometryKind(): Promise<BiometryKind> {
  try {
    const { available, biometryType } = await biometrics.isSensorAvailable();
    if (!available) {
      return 'none';
    }
    if (biometryType === BiometryTypes.FaceID) {
      return 'faceId';
    }
    if (biometryType === BiometryTypes.TouchID) {
      return 'touchId';
    }
    if (biometryType === BiometryTypes.Biometrics) {
      return 'fingerprint';
    }
    return 'none';
  } catch {
    return 'none';
  }
}

export function describeBiometry(kind: BiometryKind): string {
  switch (kind) {
    case 'faceId':
      return 'Face ID';
    case 'touchId':
      return 'Touch ID';
    case 'fingerprint':
      return '지문';
    default:
      return '생체 인증';
  }
}

/** 생체 인증 실행. 성공하면 true */
export async function authenticate(reason = '한푼 잠금 해제'): Promise<boolean> {
  try {
    const { success } = await biometrics.simplePrompt({
      promptMessage: reason,
      cancelButtonText: '취소',
    });
    return success;
  } catch {
    return false;
  }
}
