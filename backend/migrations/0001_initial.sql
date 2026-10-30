CREATE TABLE "user" (
  id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
);
CREATE TABLE session (
  id TEXT PRIMARY KEY NOT NULL, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX session_user_idx ON session(userId);
CREATE TABLE account (
  id TEXT PRIMARY KEY NOT NULL, accountId TEXT NOT NULL, providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
);
CREATE INDEX account_user_idx ON account(userId);
CREATE TABLE verification (
  id TEXT PRIMARY KEY NOT NULL, identifier TEXT NOT NULL, value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL, createdAt INTEGER, updatedAt INTEGER
);
CREATE INDEX verification_identifier_idx ON verification(identifier);
CREATE TABLE rateLimit (id TEXT PRIMARY KEY NOT NULL, key TEXT NOT NULL UNIQUE, count INTEGER NOT NULL, lastRequest INTEGER NOT NULL);
CREATE TABLE tarefas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  nome TEXT NOT NULL CHECK(length(nome) BETWEEN 1 AND 20000),
  data_come TEXT NOT NULL, data_termi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'em_andamento', 'concluido')),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  import_key TEXT,
  UNIQUE(user_id, import_key)
);
CREATE INDEX tarefas_user_created_idx ON tarefas(user_id, created_at DESC);
