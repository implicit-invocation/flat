export default (logger, aFromB) => {
  logger.info("pluginA::A.a", `\tString received: ${aFromB}`);
}
