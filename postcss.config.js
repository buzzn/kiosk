module.exports = {
  plugins: [
    require('autoprefixer')({ browsers: ['last 3 versions'] }),
    require('postcss-flexbugs-fixes')({}),
  ],
};