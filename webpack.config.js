const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Enable code splitting
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      automaticNameDelimiter: '-',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    runtimeChunk: 'single',
  };

  // Optional: better caching for static assets
  config.output.filename = '_expo/static/js/[name]-[contenthash].js';
  config.output.chunkFilename = '_expo/static/js/[name]-[contenthash].chunk.js';

  return config;
};
