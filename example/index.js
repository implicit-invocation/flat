import Container from '../src';

const container = new Container(module, './plugins.js', {
  loggingLevel: 'verbose'
});

container.get('B.a').then(text => {
  console.log("===========================================");
  console.log("Lookup from outside plugins");
  console.log(text);
  console.log("===========================================");
});
