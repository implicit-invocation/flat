import Promise from 'bluebird';
import logger from 'winston';
import chalk from 'chalk';
import {
  table,
  getBorderCharacters
} from 'table';

logger.cli();

const loadedPlugins = {};
const pendingDependencies = {};
const registeredServices = {};

const addPendingDependencies = dependencies => {
  for (let dependency of dependencies) {
    pendingDependencies[dependency] = Promise.pending();
  }
}

const loadService = async(root, path, serviceName, service) => {
  if (typeof service === 'string') {
    // shorthand for service declaration
    const frags = service.split('<<');
    const moduleName = frags[0];
    service = {
      module: moduleName.trim()
    }
    if (frags.length >= 2) {
      let depNames = frags[1].trim();
      service.require = depNames.split(',').map(name => name.trim());
    }
    if (frags.length >= 3) {
      const async = (frags[2].trim() == 'true');
      service.async = async;
    }
  }

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
  const serviceDetail = registeredServices[serviceName];
  serviceDetail.requirements = [];

  if (Array.isArray(service.require)) {
    const requirements = service.require;
    for (let requirement of requirements) {
      if (typeof requirement === 'string' && requirement.startsWith('::')) {
        // shorthand for requirement.lib
        requirement = {
          lib: requirement.substring(2)
        };
      }
      serviceDetail.requirements.push(requirement);

      if (requirement.lib) {
        // node modules and modules that is local to root
        requirementPromises.push(Promise.resolve(root.require(requirement.lib)));
      } else {
        if (pendingDependencies[requirement]) {
          requirementPromises.push(pendingDependencies[requirement].promise);
        } else {
          serviceDetail.status = 'unresolvable';
          logger.error('Service Loader', `\tUnmet dependency: "${serviceName}" requires "${requirement}" but "${requirement}" cannot be found by the container.`);
          return;
        }
      }
    }
  }

  const requirements = await Promise.all(requirementPromises);

  logger.info('Service Loader', `\tRequirements for service "${serviceName}" resolved.`);

  serviceDetail.status = 'resolved';

  let result = service.func.apply({}, requirements);

  if (service.async) {
    result = await result;
  }

  serviceDetail.status = 'ready';

  if (pendingDependencies[serviceName]) {
    pendingDependencies[serviceName].resolve(result);
    logger.info('Service Loader', `\tService "${serviceName}" resolved as a dependency.`);
  }
}

const getStatusString = status => {
  switch (status) {
    case 'pending':
      return chalk.bgYellow.bold(status);
    case 'resolved':
    case 'ready':
      return chalk.bgGreen.bold(status);
    case 'error':
    case 'unresolvable':
      return chalk.bgRed.bold(status);
  }
}

const getServiceNameString = dep => {
  if (dep.lib) {
    return chalk.bold.grey(`::${dep.lib}`);
  }

  if(!registeredServices[dep]) {
    return chalk.red.bold(dep);
  }

  const status = registeredServices[dep].status;
  switch (status) {
    case 'pending':
      return chalk.yellow.bold(dep);
    case 'resolved':
    case 'ready':
      return chalk.green.bold(dep);
    case 'error':
    case 'unresolvable':
      return chalk.red.bold(dep);
  }
}

const getServiceTable = services => {
  const data = [
    [
      chalk.bold('Name'),
      '',
      chalk.bold('Requirements'),
      chalk.bold('Status')
    ]
  ];

  for (let serviceName of services) {
    data.push([
      serviceName, !!pendingDependencies[serviceName] ? chalk.green.bold('E') : '',
      registeredServices[serviceName].requirements.map(dep => getServiceNameString(dep)).join(', '),
      getStatusString(registeredServices[serviceName].status)
    ]);
  }

  return table(data, {
    border: getBorderCharacters('ramac'),
    columns: {
      0: {
        width: 20
      },
      1: {
        width: 1
      },
      2: {
        width: 20
      },
      4: {
        width: 20
      }
    }
  });
}

const printTables = () => {
  for (let pluginName in loadedPlugins) {
    let pluginInfo = loadedPlugins[pluginName];
    console.log(`# Plugin "${pluginName}" \tat path "${pluginInfo.path}"`);
    let services = pluginInfo.services;
    console.log(getServiceTable(services));
  }
}

const enableKeyPress = () => {
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', function(key) {
    if (key === '\u0003' || key === 'q') {
      process.exit();
    }

    if (key === '`') {
      printTables();
      return;
    }

    process.stdout.write(key);
  });

}

export const load = (root, configFilePath, interactive) => {
  const pluginPaths = root.require(configFilePath);

  const pluginConfigs = {};

  pluginPaths.map(path => {
    let pluginConfig = root.require(path);
    if (pluginConfig.default) {
      pluginConfig = pluginConfig.default;
    }
    pluginConfigs[path] = pluginConfig;
    logger.info(pluginConfig.name, `\tLoading module ${pluginConfig.name} at path ${path}`);
    loadedPlugins[pluginConfig.name] = {
      path
    }
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
    loadedPlugins[pluginConfig.name].services = [];
    const services = pluginConfig.services || {};
    logger.info(pluginConfig.name, `\tInitializing services for module ${pluginConfig.name}`)
    for (let serviceName in services) {
      logger.info(pluginConfig.name, `\t\tService name: ${serviceName}`);
      loadedPlugins[pluginConfig.name].services.push(serviceName);
      registeredServices[serviceName] = {
        status: 'pending'
      };
      loadService(root, path, serviceName, services[serviceName]).catch(e => {
        registeredServices[serviceName].status = 'error';
        logger.error('Service Loader', `\tService ${serviceName} failed to load!`, e)
      });
    }
  };

  if (interactive) {
    enableKeyPress();
  }
};

export const get = (name) => {
  return pendingDependencies[name].promise;
}