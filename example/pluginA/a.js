export default (logger, aFromB) => {
  throw 'intentional';
  logger.info("pluginA::A.a", `\tString received: ${aFromB}`);
}
