CREATE TABLE messages (
  id text not null primary key,
  reply_to text references messages(id) check(reply_to is null or reply_to != id),
  from_identity text not null references players(identity),
  from_player text not null check(length(from_player) = 3),
  from_team text not null check(length(from_team) = 3),
  to_team text null check(length(to_team) = 3 or to_team is null),
  to_player text null check(length(to_player) = 3 or to_player is null),
  message text not null check(length(message) > 0 and length(message) <= 1024),
  created_at integer not null default (unixepoch())
)