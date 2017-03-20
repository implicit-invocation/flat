import chalk from 'chalk';
import {
  table,
  getBorderCharacters
} from 'table';

const getServiceString = (container, plugin, dep) => {
  if (typeof dep === 'string' && dep.startsWith('::')) {
    return chalk.grey.bold(dep);
  }
  if (dep.lib) {
    return chalk.grey.bold(`::${dep.lib}`);
  }
  let status;
  if (container.has(dep)) {
    status = container.publicServices[dep].status;
  } else if (plugin.has(dep)) {
    status = plugin.services[dep].status;
  } else {
    return chalk.red.bold(dep);
  }
  switch (status) {
    case 'pending':
    case 'resolved':
      return chalk.yellow.bold(dep);
    case 'ready':
      return chalk.green.bold(dep);
    case 'error':
    case 'unresolvable':
      return chalk.red.bold(dep);
  }
}

const padString = (string, length) => {
  while (string.length < length) {
    string = ' ' + string;
  }
  return string;
}


const getStatusString = status => {
  switch (status) {
    case 'pending':
    case 'resolved':
      return chalk.bgYellow.bold(`${padString(status, 20)}`);
    case 'ready':
      return chalk.bgGreen.bold(`${padString(status, 20)}`);
    case 'error':
    case 'unresolvable':
      return chalk.bgRed.bold(`${padString(status, 20)}`);
  }
}

export default container => {
  const plugins = container.plugins;
  for (let pluginName in plugins) {
    const plugin = plugins[pluginName];
    console.log(`Plugin "${chalk.bold(pluginName)}" @path "${chalk.bold(plugin.path)}"`);
    const services = plugin.services;
    const data = [
      [
        '',
        chalk.bold('Name'),
        chalk.bold('Requirements'),
        chalk.bold('Status')
      ]
    ]
    console.log();
    for (let serviceName in services) {
      const service = services[serviceName];
      let exportString;
      if (container.has(serviceName)) {
        exportString = chalk.yellow('E');
      } else {
        exportString = chalk.grey('X');
      }
      let requirementString = '';
      if (service.requirements) {
        requirementString = service.requirements.map(dep => getServiceString(container, plugin, dep)).join(", ");
      }

      const statusString = getStatusString(service.status);
      data.push([exportString, serviceName, requirementString, statusString]);
    }
    console.log(table(data, {
      border: getBorderCharacters('ramac'),
      columns: {
        0: {
          width: 1
        },
        1: {
          width: 20
        },
        2: {
          width: 20,
          wrapWord: true
        },
        3: {
          width: 20
        }
      }
    }));

  }
}