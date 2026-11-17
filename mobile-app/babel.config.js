module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Must run before the Reanimated/Worklets plugin (babel-preset-expo adds that one).
      ['react-native-unistyles/plugin', { root: 'src' }],
    ],
  };
};
