// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

module.exports = function (env, argv) {
  const isDevelopment = argv && argv['mode'] !== 'production'

  const plugins = [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ]

  // Only create a Sentry release when Sentry is enabled (i.e. production builds).
  // SentryWebpackPlugin automatically published source maps and creates a release.
  if (process.env.SENTRY_PUBLISH_ENABLED) {
    plugins.push(
      new SentryWebpackPlugin({
        include: './dist',
        urlPrefix: '~/citizen/',
        setCommits: {
          repo: 'espoon-voltti/evaka',
          auto: true
        }
      })
    )
  }

  return {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/citizen/'
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      plugins: [new TsconfigPathsPlugin()],
      alias: {
        Icons:
          process.env.ICONS === 'pro'
            ? path.resolve(__dirname, '../lib-icons/pro-icons')
            : path.resolve(__dirname, '../lib-icons/free-icons')
      }
    },
    plugins,
    module: {
      rules: [
        // JS/TS/JSON
        {
          test: /\.(js|jsx|ts|tsx|json)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              onlyCompileBundledFiles: true,
              compilerOptions: { noEmit: false }
            }
          }
        },
        // Static files
        {
          test: /\.(woff|woff2|otf|ttf|eot|svg|png|gif|jpg)$/,
          loader: 'file-loader',
          options: {
            name: isDevelopment ? '[name].[ext]' : '[name].[contenthash].[ext]'
          }
        }
      ]
    },
    optimization: {
      usedExports: true,
      splitChunks: {
        cacheGroups: {
          deps: {
            test: /\/node_modules\//,
            name: 'vendor',
            chunks: 'initial'
          }
        }
      }
    },
    stats: {
      children: false,
      colors: true,
      entrypoints: true,
      modules: false
    },
    performance: {
      hints: false
    },
    devServer: {
      port: 9094,
      historyApiFallback: {
        index: '/citizen/index.html'
      },
      watchOptions: {
        poll: 1000,
        ignored: /node_modules/
      }
    }
  }
}
