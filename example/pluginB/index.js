module.exports = {
  name: 'pluginB',
  description: 'Plugin B',
  services: {
    'B.a': 'a << timeout, A.b << true',
    'B.b': 'a << neverFinish'
  },
  exports: ['B.a']
};