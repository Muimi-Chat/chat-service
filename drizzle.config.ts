import { defineConfig } from 'drizzle-kit';

const DATABASE_USER = process.env.POSTGRES_USER || 'USERNAME_NOT_SET';
const DATABASE_PASSWORD = process.env.POSTGRES_PASSWORD || 'PASSWORD_NOT_SET';
const DATABASE_NAME = process.env.POSTGRES_DB || 'DB_NAME_NOT_SET'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: "postgres_db",
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
  },
});