import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type HyperdriveEnv = {
  HYPERDRIVE: {
    connectionString: string;
  };
};

/**
 * Create a request-scoped Prisma client backed by Cloudflare Hyperdrive.
 * Do not store this client in a global variable in the Workers runtime.
 */
export function getPrisma() {
  const { env } = getCloudflareContext();
  const connectionString = (env as typeof env & HyperdriveEnv).HYPERDRIVE.connectionString;
  const adapter = new PrismaPg({ connectionString, maxUses: 1 });
  return new PrismaClient({ adapter });
}
