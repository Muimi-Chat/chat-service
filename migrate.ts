import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_USERNAME = process.env.POSTGRES_USER || 'USERNAME_NOT_SET';
const DATABASE_PASSWORD = process.env.POSTGRES_PASSWORD || 'PASSWORD_NOT_SET';
const DATABASE_NAME = process.env.POSTGRES_DB || 'DB_NAME_NOT_SET'

const sql = postgres(`postgres://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@chat-db:5432/${DATABASE_NAME}`, { max: 1 })
const db = drizzle(sql);

// This will run migrations on the database, skipping the ones already applied
await migrate(db, { migrationsFolder: 'drizzle' });

// Don't forget to close the connection, otherwise the script will hang
await sql.end();