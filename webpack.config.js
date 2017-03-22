var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './src',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [['es2015', {'modules': false}]]
        },
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: 'dist/sourcemap-transformer.min.js',
    libraryTarget: 'umd',
    library: 'sourcemap-transformer'
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules', path.join(__dirname, 'src'), __dirname]
  },
  target: 'node',
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname
      },
      minimize: true
    })
  ]
};
