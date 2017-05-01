import chalk from 'chalk';
import { table, getBorderCharacters } from 'table';

const getServiceString = dep => {
  const status = dep.status;
  dep = dep.dep;

  switch (status) {
    case 'lib':
      return chalk.grey.bold(dep);
    case 'pending':
    case 'resolved':
      return chalk.yellow.bold(dep);
    case 'ready':
      return chalk.green.bold(dep);
    case 'error':
    case 'unresolvable':
    case 'missing':
      return chalk.red.bold(dep);
  }
};

const padString = (string, length) => {
  while (string.length < length) {
    string = ' ' + string;
  }
  return string;
};

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
};

export default container => {
  const containerInfo = container.getInfo();

  const plugins = containerInfo.plugins;
  for (let pluginName in plugins) {
    const plugin = plugins[pluginName];
    console.log(
      `Plugin "${chalk.bold(pluginName)}" @path "${chalk.bold(plugin.path)}"`
    );
    const services = plugin.services;
    const data = [
      ['', chalk.bold('Name'), chalk.bold('Requirements'), chalk.bold('Status')]
    ];
    console.log();
    for (let serviceName in services) {
      const service = services[serviceName];
      let exportString;
      if (service.export) {
        exportString = chalk.yellow('E');
      } else {
        exportString = chalk.grey('X');
      }
      let requirementString = '';
      if (service.requirements) {
        requirementString = service.requirements
          .map(dep => getServiceString(dep))
          .join(', ');
      }

      const statusString = getStatusString(service.status);
      data.push([exportString, serviceName, requirementString, statusString]);
    }
    console.log(
      table(data, {
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
      })
    );
  }
  if (!containerInfo.errors.length) {
    return;
  }
  console.log(chalk.bold.red(`Problem found: ${containerInfo.errors.length}`));

  const errorData = [
    [chalk.bold('Service Name'), chalk.bold('Status'), chalk.bold('Error')]
  ];
  for (let error of containerInfo.errors) {
    errorData.push([
      error.serviceName,
      getStatusString(error.status),
      error.error ? error.error.message : ''
    ]);
  }
  console.log(
    table(errorData, {
      border: getBorderCharacters('ramac'),
      columns: {
        0: {
          width: 21
        },
        1: {
          width: 20
        },
        2: {
          width: 20,
          wrapWord: true
        }
      }
    })
  );
};
