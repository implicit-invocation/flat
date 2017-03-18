export default async (timeout, bFromA) => {
  await timeout(1500);
  return `Processed by B.a: ${bFromA.toUpperCase()}`;
}
