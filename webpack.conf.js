// https://github.com/request/request/issues/1529
// Fixes errors in resolving tls, fs, net from request module (used by Plivo)

module.exports = {
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
}