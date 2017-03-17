import Promise from 'bluebird';
import logger from 'winston';

logger.cli();

const pendingDependencies = {};

const addPendingDependencies = dependencies => {
  for (let dependency of dependencies) {
    pendingDependencies[dependency] = Promise.pending();
  }
}

const loadService = async (root, path, serviceName, service) => {
  if (!service.module) return;
  if (!service.func && service.module) {
    service.func = root.require(`${path.replace(/\/$/, "")}/${service.module.replace(/^\//, "")}`);
  }

  if (!service.func || typeof service.func !== "function") {
    return;
  }

  const requirementPromises = [];

  if (Array.isArray(service.require)) {
    const requirements = service.require;
    for (let requirement of requirements) {
      if (requirement.lib) {
        // node modules and modules that is local to root
        requirementPromises.push(Promise.resolve(root.require(requirement.lib)));
      } else {
        if (pendingDependencies[requirement]) {
          requirementPromises.push(pendingDependencies[requirement].promise);
        } else {
          logger.error(`Unmet dependency: ${serviceName} requires ${requirement} but ${requirement} cannot be found by the container.`);
          return;
        }
      }
    }
  }

  const requirements = await Promise.all(requirementPromises);

  let result = service.func.apply({}, requirements);

  if (service.async) {
    result = await result;
  }

  if (pendingDependencies[serviceName]) {
    pendingDependencies[serviceName].resolve(result);
  }
}

export const load = (root, configFilePath) => {
  const pluginPaths = root.require(pluginsDescriptionPath);

  pluginPaths.map(path => {
    const pluginConfig = root.require(path);

    if (Array.isArray(pluginConfig.exports)) {
      addPendingDependencies(pluginConfig.exports);
    }

    if (Array.isArray(pluginConfig.services)) {
      const services = pluginConfig.services;
      for (let serviceName in services) {
        loadService(root, path, serviceName, services[serviceName]);
      }
    }
  });
};
