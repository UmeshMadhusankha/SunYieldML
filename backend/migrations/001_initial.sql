CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
 password_hash text NOT NULL, account_type text NOT NULL CHECK(account_type IN ('household','business','installer'))
);
CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf text NOT NULL,expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS sites (id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,owner_id));
CREATE TABLE IF NOT EXISTS scenarios (id uuid PRIMARY KEY,owner_id uuid NOT NULL,site_id uuid NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(site_id,owner_id) REFERENCES sites(id,owner_id) ON DELETE CASCADE,UNIQUE(id,owner_id,site_id));
CREATE TABLE IF NOT EXISTS estimates (id uuid PRIMARY KEY,owner_id uuid NOT NULL,site_id uuid NOT NULL,scenario_id uuid NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(scenario_id,owner_id,site_id) REFERENCES scenarios(id,owner_id,site_id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS sites_owner ON sites(owner_id);
CREATE INDEX IF NOT EXISTS scenarios_owner_site ON scenarios(owner_id,site_id);
CREATE INDEX IF NOT EXISTS estimates_owner_site ON estimates(owner_id,site_id);
