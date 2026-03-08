CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE match_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  class VARCHAR(16),
  played_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leaderboard_cache (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
