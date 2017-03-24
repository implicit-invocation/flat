# flat
[![Dependencies](https://img.shields.io/david/implicit-invocation/flat.svg)](https://david-dm.org/implicit-invocation/flat)

simple IoC for node.js

## Installation

    $ npm install flat-ioc --save

## Usage
### Container
To use `flat` in your application, you must initialize a container.
```Javascript
var Container = require('flat-ioc');
var container = new Container(module, './plugins.js', {
  loggingLevel: "error"
});
```
Constructor inputs:
- `module`: node.js module object, can be access everywhere in a node.js module file
- `configFilePath`(`string`): the path to a configuration file
- `options`:
  - `loggingLevel`(`string`): Values: "silent", "error", "warn", "http", "info", "verbose", "silly"
  - `interactive`(`boolean`): enable or disable the interactive mode

The configuration file can be a JSON file

```JSON
[
    "path_to_plugin1",
    "path_to_plugin2",
    "path_to_plugin3",
    "path_to_plugin4"
]
```

Or a node module file that exports an array of paths

```Javascript
module.exports = [
  // common
    'path_to_plugin1',
    'path_to_plugin2',
    
    // features
    'path_to_plugin3',
    'path_to_plugin4'
];
```

The path to a plugin must be relative to the `module` where you initialize the container.

### Plugin
You can declare a plugin by creating a plugin description file.  
Plugin description file can be a JSON file or a node module that exports a literal object.

```Javascript
module.exports = {
  name: 'your plugin name', // plugins without a name will be ignored
    description: 'your plugin description', // optional
    services: {
        'service-name-1': <service-description-1>,
        'service-name-2': <service-description-2>,
        ...
    },
    exports: [ 'service-name-1', 'service-name-2' ]
};
```

A plugin can have multiple services and can export some of those services for other plugins' services to import as dependencies.

### Service

Services are something you need to run, can return some result or a `Promise` for a result (async service).

A service may have multiple requirements
- `lib dependencies`: npm dependencies or node module files that can be `require`d by given `module`, can be described by `{ lib: 'moduleName' }` or `::moduleName`
- `private services`: services that in the same plugin (don't have to be exported by the plugin)
- `public services`: exported services from other plugins  

When resolving a service's dependency, the service loader will look in private services first, if not found, it will look in public services and mark the service as unresolvable if fails.

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
        lib: 'winston' // project dependency, you can use shorthand ::winston
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
      require: [
        '::winston' // shorthand for {lib: 'winston'}
      ]
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

### Shorthands

For `lib` dependencies, you can use `::` prefix
```Javascript
module.exports = {
  ...
  services: {
    'com.example.module1.service1': {
      /**
       * equivalent to [{ lib: 'express' }, { lib:'winston' }]
       */
      require: [ '::express', '::winston' ]
    }
  }
}
```

For service declaration
```Javascript
module.exports = {
  ...
  services: {
    /**
     * You can declare a service using this shorthand:
     * `module_path << requirements << async`
     * Async is set to false by default, if not specified.
     * Requirements are comma separated.
     */
    'com.example.module1.service2': './service2 << ::winston, com.example.module2.serviceX << true'
  }
}
```

### Service look up
You can lookup for a service by calling `container.get`, this function always returns a promise.
You should run all of your code from inside of plugins and use this function for writing tests.
```Javascript
container.get('serviceName').then(function(service) {
  // do something with the service
});
```
### Monitoring
You can enable interactive mode

After that, everytime you press enter, a nice table will appear
![Table](table.png?raw=true "table")

You can also get the plugin details and errors by calling
```Javascript
container.getInfo();
```

You can access the container from plugins by injecting the `context` service.
```Javascript
module.export = {
  ...
  services: {
    'admin.pluginDetails': {
      require: [ 'adminAPI', 'context', 'checkPerm', 'renderTemplate' ],
      func: (adminAPI, context, checkPerm) => {
        adminAPI.get('/pluginDetails', checkPerm('plugins.monitor'), (req, res) => {
          res.send(renderTemplate(__dirname, 'plugins.hb', context.getInfo())))
        }
      }
    }
  }
}

```

## TODO

 - ~~allow getting a service by name from outside of the container~~
 - plugins hot deployment/refresh
 - support callback for async service factory method (now only promise is supported)