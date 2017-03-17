# flat
[![Dependencies](https://img.shields.io/david/implicit-invocation/flat.svg)](https://david-dm.org/implicit-invocation/flat)

simple IoC for node.js

## Installation

    $ npm install flat --save

## Usage

### Plugin
You can declare a plugin by creating a plugin description file.
Plugin description file can be a JSON file or a node module that exports a literal object.

A plugin can have multiple services and can export some of those services for other plugins' services can import as dependencies.

You can declare a service by providing a factory function or the path to a node module that exports a factory function.

```Javascript
module.exports = {
  name: 'your module name', // for logging
  description: 'your module description',
  services: {
    // an inline service
    'com.example.module1.service1': { // service name must be unique
      /**
       * You can specify the service's requirements.
       * Requirements can be any node module you can require from your application file (useful
       * for npm dependencies and non-plugin modules) or another service from another plugin.
       */
      require: ['com.example.module2.serviceX' /* a service from another plugin */ , {
        lib: 'winston' // project dependency
      }, {
        lib: './lib/some-lib' // module relative to main entry
      }],
      /**
       * If you use a node module as plugin description, you can define your
       * service inline by providing the factory function. Requirements are
       * passed as arguments with the same order.
       */
      func: function(logger, someLib, serviceX) {}
    },
    // an async service
    'com.example.module1.service2': {
      /**
       * You can specify the path to the node module that exports a factory
       * function.
       */
      module: './service2',
      /**
       * If async is set to true, your factory function must return a promise
       * Other services that depend on this service will wait for the promise to
       * resolve.
       */
      async: true
    }
  },
  exports: ['com.example.module1.service2'] // Optional
};

```

### Config file
A JSON file or a node module that exports an array contains path to plugins' descriptions.
```JSON
[
  "./common/common-plugin1",
  "./common/common-plugin1",
  "./plugins/plugin1",
  "./plugins/plugin2"
]

```
### Use it in your app
```Javascript
var container = require('flat');

container.load(module, './plugins.js');
```

### Service look up
You can call `container.get`, this function returns a promise.
```Javascript
container.get('serviceName').then(function(service) {
  // do something with the service
});
```

## TODO

 - ~~allow getting a service by name from outside of the container~~
 - plugins hot deployment/refresh
 - support callback for async service factory method (now only promise is supported)