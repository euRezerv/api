import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import log from "@utils/logger";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  log.error("DATABASE_URL is not defined in environment variables");
  throw new Error("DATABASE_URL is not defined in environment variables");
}

export const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  pool.end(() => {
    log.info("PostgreSQL pool closed.");
    process.exit(0);
  });
});

export default prisma;
