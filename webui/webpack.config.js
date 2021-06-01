const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  
  // bundling mode
  mode: "development",
  devtool: "source-map",
  
  // entry files
  entry: "./src/index.tsx",
  
  // output bundles (location)
  output: {
    path: path.resolve( __dirname, "../static" ),
    filename: "index.js",
    publicPath: "/assets/",
  },
  
  // file resolutions
  resolve: {
    extensions: [ ".ts", ".js", ".tsx" ],
    fallback: {
      "buffer": require.resolve("buffer/") // webpack 5 doesn't include polyfills
    },
    alias: {
      "react": "preact/compat",
      "react-dom": "preact/compat"
    }
  },

  watchOptions: {
    ignored: /node_modules/,
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
