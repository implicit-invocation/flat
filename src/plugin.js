import Service from './service';
import Promise from 'bluebird';

export default class Plugin {
  constructor(container, path, config) {
    this.path = path;
    this.container = container;
    this.name = config.name;
    this.description = config.description;
    this.services = {};
    this.logger = container.logger;
    this.loadServices(config.services || []);
    this.exportServices(config.exports || []);
  }
  loadServices(services) {
    this.logger.info(this.name, `\t\tInitializing services`);
    for (let name in services) {
      const serviceConfig = services[name];
      const service = new Service(this.container, this, name, serviceConfig);
      this.services[name] = service;
      this.logger.verbose(this.name, `\t\t\tService name: ${name}`);
    }
  }
  exportServices(exportNames) {
    this.logger.info(this.name, `\t\tRegistering public services`);
    exportNames.map(name => {
      if (this.services[name]) {
        this.services[name].export = true;
        this.container.registerService(name, this.services[name]);
      }
      this.logger.verbose(this.name, `\t\t\tService name: ${name}`);
    });
  }

  resolveServices() {
    for (let name in this.services) {
      const service = this.services[name];
      service.resolve().catch(e => {
        service.status = 'error';
        service.error = e;
        this.container.reportError(service, e);
        this.logger.error(
          this.name,
          `\t\tFailed to resolve service ${name}`,
          e
        );
      });
    }
  }

  has(name) {
    if (this.services[name]) {
      return true;
    }
    return false;
  }

  get(name) {
    if (this.services[name]) {
      return this.services[name].promise;
    }
    return Promise.resolve(null);
  }

  getInfo() {
    const info = {
      name: this.name,
      description: this.description,
      path: this.path,
      services: {}
    };
    for (let serviceName in this.services) {
      const service = this.services[serviceName];
      info.services[serviceName] = service.getInfo();
    }
    return info;
  }
}
