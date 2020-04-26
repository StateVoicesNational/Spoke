export function isClient() {
  return typeof window !== "undefined";
}

console.log("This is an intentional lint violation");
