import "dotenv/config";
import { defineConfig } from "@prisma/config";

const directUrl =
  process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error(
    "Missing required database migration URL. Set DIRECT_URL, DATABASE_URL_UNPOOLED, or DATABASE_URL in your environment.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: directUrl,
  },
});
