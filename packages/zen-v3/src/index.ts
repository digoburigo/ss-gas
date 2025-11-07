// @ts-nocheck

import type { ClientContract } from "@zenstackhq/orm";
import { ZenStackClient } from "@zenstackhq/orm";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { SchemaType } from "./zenstack/schema";
import { schema } from "./zenstack/schema";

export const db = new ZenStackClient(schema, {
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

export type DbClient = ClientContract<SchemaType>;

export const authDb = db.$use(new PolicyPlugin());
