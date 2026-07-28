/**
 * Jest 공용 셋업.
 *
 * AsyncStorage 는 네이티브 모듈이라 노드에서 그냥 import 하면 죽는다.
 * 공식 제공 목을 끼워 store / queryClient 를 건드리는 테스트도 돌 수 있게 한다.
 * (https://react-native-async-storage.github.io/async-storage/docs/advanced/jest)
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
