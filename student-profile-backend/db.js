import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // THIS IS THE FIX — SSL REQUIRED BY RDS
  ssl: {
    rejectUnauthorized: false, // AWS RDS uses self-signed cert in free tier
  },
});

export default pool;
