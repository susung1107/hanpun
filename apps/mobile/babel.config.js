module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  // react-native-reanimated/plugin 은 항상 마지막에 위치해야 한다 (공식 요구사항)
  plugins: ['react-native-reanimated/plugin'],
};
