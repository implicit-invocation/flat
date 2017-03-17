module.exports = {
  name: 'pluginA',
  description: 'Plugin A',
  services: {
    'A.a': {
      module: './a.js',
      require: ['::winston', 'B.a']
    },
    'A.b': {
      module: './b.js',
      async: true,
      require: [ 'timeout' ]
    },
    'A.c': {
      func: logger => {
        logger.info('pluginA::A.c', '\tTest inline service');
      },
      require: [{
        lib: 'winston'
      }]
    }
  },
  exports: [ 'A.b' ]
};
