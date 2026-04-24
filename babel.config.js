module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@nav':        './app/navigation',
            '@screens':    './app/screens',
            '@hooks':      './app/hooks',
            '@stores':     './app/stores',
            '@utils':      './app/utils',
            '@components': './app/components',
          },
        },
      ],
    ],
  };
};