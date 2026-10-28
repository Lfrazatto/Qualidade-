PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  accessed_at TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS content_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  kicker TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL CHECK (subject IN ('iveco','cummins','meritor','connection')),
  date_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
);

CREATE TABLE IF NOT EXISTS truck_models (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL DEFAULT 'IVECO',
  model TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'Brasil',
  category TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL DEFAULT '',
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
);

CREATE TABLE IF NOT EXISTS model_specs (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES truck_models(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  conditions TEXT NOT NULL DEFAULT '',
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
);

CREATE TABLE IF NOT EXISTS truck_hotspots (
  id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES truck_models(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  x_pct REAL NOT NULL DEFAULT 50,
  y_pct REAL NOT NULL DEFAULT 50,
  explanation TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  attribution TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL DEFAULT 'exploration',
  config_json TEXT NOT NULL DEFAULT '{}',
  is_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_option INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  accept_scores INTEGER NOT NULL DEFAULT 0 CHECK (accept_scores IN (0,1)),
  show_leaderboard INTEGER NOT NULL DEFAULT 0 CHECK (show_leaderboard IN (0,1)),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1))
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  pseudonym TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(event_id, pseudonym COLLATE NOCASE)
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE SET NULL,
  points INTEGER NOT NULL CHECK (points >= 0 AND points <= 10000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(event_id, participant_id, game_id)
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_timeline_subject_order ON timeline_events(subject, sort_order);
CREATE INDEX IF NOT EXISTS idx_models_status ON truck_models(status, brand, model);
CREATE INDEX IF NOT EXISTS idx_specs_model ON model_specs(model_id, status);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_scores_event_points ON scores(event_id, points DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
