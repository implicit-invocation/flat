import Promise from 'bluebird';

const prepareConfig = config => {
  if (typeof config === 'string') {
    // shorthand for service declaration
    const frags = config.split('<<');
    const moduleName = frags[0];
    let ret = {
      module: moduleName.trim()
    };
    if (frags.length >= 2) {
      let depNames = frags[1].trim();
      ret.require = depNames.split(',').map(name => name.trim());
    }
    if (frags.length >= 3) {
      const async = (frags[2].trim() == 'true');
      ret.async = async;
    }
    return ret;
  }
  return config;
}

export default class Service {
  constructor(container, plugin, name, config) {
    this.container = container;
    this.plugin = plugin;
    this.name = name;
    config = prepareConfig(config);
    this.requirements = config.require;
    this.config = config;
    this.pending = Promise.pending();
    this.promise = this.pending.promise;
    this.status = "pending";
  }

  async resolve() {
    let service = this.config;
    let container = this.container;
    let plugin = this.plugin;
    let root = container.root;
    let logger = container.logger;

    if (!service.func) {
      if (service.module) {
        try {
          service.func = root.require(`${plugin.path.replace(/\/$/, "")}/${service.module.replace(/^\//, "")}`);
          if (service.func.default) {
            // ES6 export default
            service.func = service.func.default;
          }
        } catch (e) {
          service.func = null;
        }

      }
    }

    if (!service.func || typeof service.func !== "function") {
      logger.error(plugin.name, `\t\tCannot find factory function for service ${this.name}`);
      this.status = "unresolvable";
      return;
    }

    const requirementPromises = [];

    if (Array.isArray(service.require)) {
      const requirements = service.require;
      for (let requirement of requirements) {
        if (typeof requirement === 'string' && requirement.startsWith('::')) {
          // shorthand for requirement.lib
          requirement = {
            lib: requirement.substring(2)
          };
        }
        if (requirement.lib) {
          // node modules and modules that is local to root
          try {
            const mod = root.require(requirement.lib);
            requirementPromises.push(Promise.resolve(mod));
          } catch (e) {
            logger.error(plugin.name, `\t\tUnmet dependency: "${this.name}" requires node module: "${requirement.lib}"`);
            this.status = "unresolvable";
            return;
          }
        } else if (plugin.has(requirement)) {
          requirementPromises.push(plugin.get(requirement));
        } else if (container.has(requirement)) {
          requirementPromises.push(container.get(requirement));
        } else {
          logger.error(plugin.name, `\t\tUnmet dependency: "${this.name}" requires "${requirement}" but "${requirement}" cannot be found by the container.`);
          this.status = "unresolvable";
          return;
        }
      }
    }

    const requirements = await Promise.all(requirementPromises);
    this.status = 'resolved';

    logger.verbose(plugin.name, `\t\tRequirements for service "${this.name}" resolved.`)

    let result = service.func.apply({}, requirements);

    if (service.async) {
      result = await result;
    }

    this.pending.resolve(result);
    logger.verbose(plugin.name, `\tService "${this.name}" resolved.`);
    this.status = 'ready';
  }
}