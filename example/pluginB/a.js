export default async (timeout, bFromA) => {
  await timeout(500);
  return `Processed by B.a: ${bFromA.toUpperCase()}`;
}
