const { override, addWebpackResolve } = require('customize-cra');

module.exports = override(
  addWebpackResolve({
    fallback: {
      "https": require.resolve("https-browserify"),
    },
  }),
  (config) => {
    // Remove CssMinimizerPlugin
    config.optimization.minimizer = config.optimization.minimizer.filter(
      (minimizer) => minimizer.constructor.name !== 'CssMinimizerPlugin'
    );
    return config;
  }
);