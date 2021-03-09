const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  
  // bundling mode
  mode: "production",
  
  // entry files
  entry: "./src/index.ts",
  
  // output bundles (location)
  output: {
    path: path.resolve( __dirname, "../static" ),
    filename: "index.js",
  },
  
  // file resolutions
  resolve: {
    extensions: [ ".ts", ".js" ],
  },
  
  // loaders
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: "ts-loader",
        exclude: /node_modules/,
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
