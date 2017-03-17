module.exports = {
  name: "pluginA",
  description: "Plugin A",
  services: {
    "A.a": {
      module: './a.js',
      require: [{
        lib: 'winston'
      }, "B.a"]
    },
    "A.b": {
      module: './b.js',
      async: true,
      require: [ "timeout" ]
    }
  },
  exports: [ 'A.b' ]
};
