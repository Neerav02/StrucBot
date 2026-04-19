import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Connection pool — works with both local and cloud PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL for cloud providers (Neon, Supabase, Render)
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Auto-create tables if they don't exist.
 * Safe to run multiple times (idempotent).
 */
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(100) UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) DEFAULT 'user',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1.5 Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name          VARCHAR(100) NOT NULL,
        description   TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `);

    // 2. Schemas table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schemas (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        table_name    VARCHAR(255) NOT NULL,
        columns       JSONB NOT NULL,
        prompt        TEXT,
        ai_generated  BOOLEAN DEFAULT true,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Chat history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender        VARCHAR(10) NOT NULL,
        type          VARCHAR(20) NOT NULL,
        content       TEXT NOT NULL,
        schema_id     UUID REFERENCES schemas(id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Performance indices (IF NOT EXISTS)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_schemas_user ON schemas(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_schemas_created ON schemas(created_at DESC);`);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL tables initialized successfully');

    // Run safe ALTER TABLE outside the transaction block to prevent transaction abortion on error
    try {
      await client.query(`ALTER TABLE schemas ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;`);
    } catch (e) {
      // Column already exists or other error, safe to ignore
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Seed the admin user (only if not exists).
 */
export async function seedAdminUser(bcrypt) {
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (existing.rows.length > 0) {
    console.log('👤 Admin user already exists');
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('admin123', salt);
  await pool.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
    ['admin', 'admin@strucbot.com', hash, 'admin']
  );
  console.log('👤 Admin user created (admin / admin123)');
}

export default pool;
