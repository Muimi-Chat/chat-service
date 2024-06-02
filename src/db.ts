import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from './schema';

const DATABASE_URL = process.env.POSTGRES_USER || 'USERNAME_NOT_SET';
const DATABASE_PASSWORD = process.env.POSTGRES_PASSWORD || 'PASSWORD_NOT_SET';
const DATABASE_NAME = process.env.POSTGRES_DB || 'DB_NAME_NOT_SET'

export const pool = new pg.Pool({
    host: "chat-db",
    port: 5432,
    user: DATABASE_URL,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
});

export const db = drizzle(pool, { schema });
