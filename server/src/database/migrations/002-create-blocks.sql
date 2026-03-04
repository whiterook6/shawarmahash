CREATE TABLE blocks (
  hash TEXT NOT NULL PRIMARY KEY CHECK(length(hash) = 32),
  previous_hash TEXT NOT NULL CHECK(length(previous_hash) = 32),
  "index" INTEGER NOT NULL,
  player TEXT NOT NULL check(length(player) = 3),
  team TEXT NOT NULL check(length(team) = 3),
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)