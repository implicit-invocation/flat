import * as Container from '../src';

Container.load(module, './plugins.js');

Container.get('B.a').then(text => {
  console.log("-------------------------------------------");
  console.log(text);
  console.log("-------------------------------------------");
});
