export function testDatabase(value: string) {
  const url = new URL(value);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.pathname !== "/platemate_test" ||
    url.search
  )
    throw new Error("Base de test dédiée obligatoire");
  return value;
}
