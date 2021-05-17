const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  
  // bundling mode
  mode: "development",
  
  // entry files
  entry: "./src/index.ts",
  
  // output bundles (location)
  output: {
    path: path.resolve( __dirname, "../static" ),
    filename: "index.js",
    publicPath: "/assets/",
  },
  
  // file resolutions
  resolve: {
    extensions: [ ".ts", ".js" ],
    fallback: {
      "buffer": require.resolve("buffer/") // webpack 5 doesn't include polyfills
    }
  },
  
  // loaders
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.ts$/,
        loader: "worker-loader",
        options: {
          esModule: false,
        },
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      inject: true,
      publicPath: "/assets/",
      template: "src/index.html",
    })
  ],
};
