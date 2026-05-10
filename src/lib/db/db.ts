import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from './schema'


const pool = new Pool({
    user: 'baryshnikov_ii',
    host: '80.250.189.52',
    database: 'dbcourse',
    password: 'VY%6e%dG2j$',
    port: 5432

});

// Локальный postgres
// const pool = new Pool({
    // connectionString: process.env.DATABASE_URL!,
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
// });

export const db = drizzle(pool, { schema });