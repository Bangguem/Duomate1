module.exports = {
  transpileDependencies: [],
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Duo-Mate/'  // GitHub Pages에서 사용할 리포지토리 이름으로 변경
    : '/'
}