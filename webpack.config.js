const path = require('path');

module.exports = {
  entry: './express_app/app.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[hash].[ext]',
          outputPath: 'assets/',
        },
      },
      {
        test: /\.(node)$/i,
        loader: 'buffer-loader',
        type: 'javascript/auto',
      },
    ],
  },
  mode: 'development',
  resolve: {
    fallback: {
      fs: false,
      assert: require.resolve('assert/'),
      stream: require.resolve('stream-browserify'),
      dns: require.resolve('dns'),
      timers: require.resolve('timers-browserify'),
      path: require.resolve('path-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify'),
      url: require.resolve('url/'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      zlib: require.resolve('browserify-zlib'),
      console: require.resolve('console-browserify'),
      child_process: require.resolve('child_process'),
      tls: require.resolve('tls'),
    },
  },
  stats: {
    errorDetails: true,
  },
};
