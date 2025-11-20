import {Client} from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      token_in VARCHAR(100) NOT NULL,
      token_out VARCHAR(100) NOT NULL,
      amount_in NUMERIC NOT NULL,
      slippage NUMERIC NOT NULL,
      status VARCHAR(20) NOT NULL,
      selected_dex VARCHAR(20),
      tx_hash VARCHAR(255),
      failure_reason TEXT,
      executed_price NUMERIC,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✔ Migration complete: 'orders' table created");

  await client.end();
}

if (require.main === module) {
  migrate().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
