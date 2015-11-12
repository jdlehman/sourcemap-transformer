var webpack = require('webpack');

module.exports = {
  entry: './src',
  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel', exclude: /node_modules/}
    ]
  },
  output: {
    filename: 'dist/sourcemap-transformer.min.js',
    libraryTarget: 'umd',
    library: 'sourcemap-transformer'
  },
  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules'],
    fallback: __dirname
  },
  target: 'node',
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ]
};
