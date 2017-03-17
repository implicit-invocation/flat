export default {
  name: "common",
  description: "Shared libraries",
  services: {
    "timeout": {
      module: './timeout.js',
      require: [{
        lib: 'bluebird'
      }]
    }
  },
  exports: [ 'timeout' ]
};
