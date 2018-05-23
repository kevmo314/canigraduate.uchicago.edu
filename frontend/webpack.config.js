const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const history = require("connect-history-api-fallback");
const convert = require("koa-connect");

module.exports = {
  mode: process.env.NODE_ENV,
  devtool:
    process.env.NODE_ENV == "development" ? "eval-source-map" : "source-map",
  entry: ["@babel/polyfill", "./src/index.js"],
  resolve: {
    extensions: [".js", ".ts", ".vue", ".json"],
    alias: {
      vue$: "vue/dist/vue.esm.js",
      "@": __dirname + "/src"
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: { loaders: { ts: "babel-loader" } }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "static/img/[name].[hash:7].[ext]"
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "static/fonts/[name].[hash:7].[ext]"
        }
      }
    ]
  },
  output: { publicPath: "/" },
  plugins: [
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new HtmlWebpackPlugin({
      template: "src/index.html",
      inject: true
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
  serve: {
    add(app, middleware, options) {
      app.use(convert(history()));
    }
  }
};
