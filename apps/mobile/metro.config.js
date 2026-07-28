const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/**
 * Metro 설정 — pnpm 모노레포 표준 구성
 * 1) watchFolders 로 저장소 루트를 감시해 packages/shared 변경을 감지
 * 2) nodeModulesPaths 로 앱/루트 node_modules 를 모두 해석
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: false,
  },
};

module.exports = withNativeWind(mergeConfig(getDefaultConfig(projectRoot), config), {
  input: './src/styles/global.css',
});
