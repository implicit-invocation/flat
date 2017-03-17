import Promise from 'bluebird';
import logger from 'winston';

logger.cli();

const pendingDependencies = {};

const addPendingDependencies = dependencies => {
  for (let dependency of dependencies) {
    pendingDependencies[dependency] = Promise.pending();
  }
}

const loadService = async(root, path, serviceName, service) => {
  if (!service.func) {
    if (service.module) {
      service.func = root.require(`${path.replace(/\/$/, "")}/${service.module.replace(/^\//, "")}`);
      if (service.func.default) {
        // ES6 export default
        service.func = service.func.default;
      }
    } else {
      return;
    }
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
          logger.error('Service Loader', `\tUnmet dependency: "${serviceName}" requires ${requirement} but ${requirement} cannot be found by the container.`);
          return;
        }
      }
    }
  }

  const requirements = await Promise.all(requirementPromises);

  logger.info('Service Loader', `\tRequirements for service "${serviceName}" resolved.`);

  let result = service.func.apply({}, requirements);

  if (service.async) {
    result = await result;
  }

  if (pendingDependencies[serviceName]) {
    pendingDependencies[serviceName].resolve(result);
    logger.info('Service Loader', `\tService "${serviceName}" resolved as a dependency.`);
  }
}

export const load = (root, configFilePath) => {
  const pluginPaths = root.require(configFilePath);

  const pluginConfigs = {};

  pluginPaths.map(path => {
    let pluginConfig = root.require(path);
    if (pluginConfig.default) {
      pluginConfig = pluginConfig.default;
    }
    pluginConfigs[path] = pluginConfig;
    logger.info(pluginConfig.name, `\tLoading module ${pluginConfig.name} at path ${path}`);
  });

  for (let path in pluginConfigs) {
    const pluginConfig = pluginConfigs[path];


    if (Array.isArray(pluginConfig.exports)) {
      logger.info(pluginConfig.name, `\tExporting services from module ${pluginConfig.name}: ${pluginConfig.exports.join(', ')}`);
      addPendingDependencies(pluginConfig.exports);
    }
  };

  for (let path in pluginConfigs) {
    const pluginConfig = pluginConfigs[path];

    const services = pluginConfig.services || {};
    logger.info(pluginConfig.name, `\tInitializing services for module ${pluginConfig.name}`)
    for (let serviceName in services) {
      logger.info(pluginConfig.name, `\t\tService name: ${serviceName}`);
      loadService(root, path, serviceName, services[serviceName]);
    }
  };
};

export const get = (name) => {
  return pendingDependencies[name].promise;
}
