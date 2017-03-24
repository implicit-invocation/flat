module.exports = {
  name: 'pluginA',
  description: 'Plugin A',
  services: {
    'A.a': './a.js << ::winston, B.a',
    'A.b': './b.js << timeout << true',
    'A.d': 'd',
    'A.string': {
      func: () => 'A test string from A.string'
    },
    'A.c': {
      func: logger => {
        logger.info('pluginA::A.c', '\tTest inline service');
      },
      require: ['::winston', 'test']
    }
  },
  exports: [ 'A.b' ]
};
