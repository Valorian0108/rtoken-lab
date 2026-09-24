export * from "./transport";
export * from "./endpoints";
export * from "./qwen";

import { createClient } from "./endpoints";

let initialized = false;
let singleton: ReturnType<typeof createClient> | undefined;

export function getMcpClient() {
  singleton ??= createClient();
  return singleton;
}

export async function initializeMcpClient(): Promise<void> {
  if (initialized) return;
  await getMcpClient().initialize();
  initialized = true;
}