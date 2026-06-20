export async function requestStoragePersistence(): Promise<"granted" | "denied" | "unsupported"> {
  if (!navigator.storage?.persist) {
    return "unsupported";
  }
  return (await navigator.storage.persist()) ? "granted" : "denied";
}
