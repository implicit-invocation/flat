import Plugin from './plugin';
import printTables from './print-tables';

import Promise from 'bluebird';
import winston from 'winston';

const CONTAINER_DEFAULT_CONFIG = {
  interactive: true,
  loggingLevel: "info"
};

class Container {
  constructor(root, configFilePath, configs) {
    configs = {...CONTAINER_DEFAULT_CONFIG,
      ...configs
    };
    const logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          timestamp: () => new Date().toLocaleString(),
          level: configs.loggingLevel
        })
      ]
    });
    logger.cli();
    this.logger = logger;
    this.root = root;
    this.plugins = {};
    this.errors = [];
    this.publicServices = {};
    const pluginPaths = root.require(configFilePath);
    this.loadPluginConfigs(pluginPaths);

    if (configs.interactive) {
      this.enableKeyPress();
    }
  }

  reportError(service, error) {
    this.errors.push({
      serviceName: service.name,
      status: service.status,
      error
    });
  }

  enableKeyPress() {
    process.stdin.on('data', () => printTables(this));
  }

  getLogger() {
    return this.logger;
  }

  registerService(name, service) {
    this.publicServices[name] = service;
  }

  loadPluginConfigs(pluginPaths) {
    pluginPaths.map(path => {
      let config = this.root.require(path);
      if (config.default) {
        // ES6 export default
        config = config.default;
      }
      if (!config || !config.name) {
        return;
      }
      this.logger.info("flat-ioc", `\tLoading plugin ${config.name} @path ${path}`);
      this.plugins[config.name] = new Plugin(this, path, config);
    });

    this.logger.info("flat-ioc", `\tDone loading plugins. Trying to resolve services.`);

    this.publicServices['context'] = {
      promise: Promise.resolve(this)
    }

    for (let name in this.plugins) {
      this.plugins[name].resolveServices();
    }
  }

  get(name) {
    if (this.publicServices[name]) {
      return this.publicServices[name].promise
    }
    return Promise.resolve(null);
  }

  has(name) {
    if (this.publicServices[name]) {
      return true;
    }
    return false;
  }

  getInfo() {
    const info = {};
    for (let pluginName in this.plugins) {
      info[pluginName] = this.plugins[pluginName].getInfo();
    }
    return {
      plugins: info,
      errors: this.errors
    };
  }
}

module.exports = Container;