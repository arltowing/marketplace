CREATE TABLE IF NOT EXISTS marketplace_admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  google_subject TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS marketplace_admin_sessions (
  id TEXT PRIMARY KEY,
  admin_user_id BIGINT NOT NULL REFERENCES marketplace_admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  user_agent_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON marketplace_admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON marketplace_admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS marketplace_admin_audit (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT REFERENCES marketplace_admin_users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  listing_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO marketplace_admin_users(email,display_name) VALUES
 ('rudolphvanwyk@rocketmail.com','TCS Admin'),
 ('theosteynplant@gmail.com','TCS Admin'),
 ('janplessis@yahoo.co.uk','TCS Admin')
ON CONFLICT(email) DO NOTHING;
