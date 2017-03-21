export default (logger, aFromB, aString) => {
  console.log("===========================================");
  console.log("pluginA::A.a", `\tFrom A.string: ${aString}`);
  console.log("pluginA::A.a", `\tFrom B.a: ${aFromB}`);
  console.log("===========================================");
  throw new Error('intentional');
}
