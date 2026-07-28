module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'off',
  },
  overrides: [
    {
      // 테스트 셋업 파일에도 jest 전역이 있다
      files: ['jest.setup.js', '__tests__/**/*.{js,ts,tsx}'],
      env: { jest: true },
    },
  ],
};
