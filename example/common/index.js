export default {
  name: 'common',
  description: 'Shared libraries',
  services: {
    'timeout': {
      module: './timeout.js',
      require: ['::bluebird']
    },
    'neverFinish': {
      require: ['::bluebird'],
      async: true,
      func: Promise => Promise.pending().promise
    }
  },
  exports: [ 'timeout', 'neverFinish' ]
};
