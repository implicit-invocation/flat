module.exports = {
  name: 'pluginA',
  description: 'Plugin A',
  services: {
    'A.a': './a.js << ::winston, B.a',
    'A.b': './b.js << timeout << true',
    'A.c': {
      func: logger => {
        logger.info('pluginA::A.c', '\tTest inline service');
      },
      require: [{
        lib: 'winston'
      }, 'test']
    }
  },
  exports: [ 'A.b' ]
};
