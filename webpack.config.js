var HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: './src/ts/main.ts',
  // ファイルの出力設定
  output: {
    //  出力ファイルのディレクトリ名
    path: `${__dirname}/docs/js`,
    // 出力ファイル名
    filename: 'bundle.js'
  },
  plugins: [
      new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/pug/index.pug',  // この行を変更
      inject: true
    }),
    new ExtractTextPlugin("main.css"),
    new webpack.LoaderOptionsPlugin({ minimize: true })
  ],
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: 'awesome-typescript-loader'
      },
      // ソースマップファイルの処理
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      },
      {
        test: /\.pug$/,
        loader: ['raw-loader', 'pug-html-loader']
      },
      {
        // Stylusファイル用の処理
        test: /\.styl/,
        use: ExtractTextPlugin.extract({
          use: ["css-loader", "stylus-loader"]
        })
      },
    ]
  },
  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: [
      '.ts', '.js', '.json', '.pug', '.styl'
    ],
  },
  // ソースマップを有効に
  devtool: 'source-map'
};
