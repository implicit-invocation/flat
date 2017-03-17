module.exports = {
  name: 'pluginB',
  description: 'Plugin B',
  services: {
    'B.a': {
      module: './a.js',
      async: true,
      require: ['timeout', 'A.b']
    }
  },
  exports: ['B.a']
};