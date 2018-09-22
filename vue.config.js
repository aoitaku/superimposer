const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([{
        from: 'public/server/index.html',
        to: 'server/index.html',
      }]),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      // List native deps here if they don't work
      externals: ['express-ws'],
    },
  },
}
