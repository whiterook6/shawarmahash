CREATE TABLE players (
  identity TEXT NOT NULL PRIMARY KEY,
  player TEXT CHECK(player IS NULL OR length(player) = 3),
  team TEXT CHECK(team IS NULL OR length(team) = 3),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);