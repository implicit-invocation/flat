export default (Promise) => {
  return (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
