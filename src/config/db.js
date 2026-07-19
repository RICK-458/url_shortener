import pg from "pg";

const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.on("error", (err) => {
  console.error("unexpected error on idle db client", err.stack);
});

export default db;
