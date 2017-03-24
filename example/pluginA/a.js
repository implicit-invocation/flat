export default (logger, aFromB) => {
  console.log("===========================================");
  console.log("pluginA::A.a", `\tFrom B.a: ${aFromB}`);
  console.log("===========================================");
  throw new Error('intentional');
}
