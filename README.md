# ShawarmaHash

A blockchain-based game where players mine blocks on team-specific chains. This document explains the block structure, mining process, difficulty adjustment, and available APIs.

## Block Structure

A block in ShawarmaHash contains the following fields:

```typescript
type Block = {
  /** The index of the block in the chain. Genesis block is index 0. */
  index: number;

  /** The player who mined the block. Format: AAA-ZZZ */
  player: string;

  /** The team that the player is on. Format: AAA-ZZZ */
  team: string;

  /** The timestamp of the block in seconds (Unix timestamp). */
  timestamp: number;

  /** The nonce of the block. A number that is incremented until the hash meets the difficulty target. */
  nonce: number;

  /** The hash of the block. A SHA-256 hash of the block's data. */
  hash: string;

  /** The previous hash of the block. A SHA-256 hash of the previous block's data. */
  previousHash: string;

  /** A message associated with the block (optional). */
  message?: string;
};
```

### Genesis Block

The genesis block (index 0) has special properties:
- `previousHash` is always `"ffffffffffffffffffffffffffffffff"` (32 hex characters)
- `previousTimestamp` is `0` for hash calculation purposes
- Must meet the default difficulty target: `"fffff000000000000000000000000000"`

## Hash Calculation

The block hash is calculated using SHA-256 over the following concatenated string:

```
previousHash + previousTimestamp + player + team + nonce
```

The resulting hash is then truncated to 32 hexadecimal characters (128 bits).

**Note:** If `team` is `undefined` or `null`, it is replaced with an empty string in the hash calculation.

**Example:**
```typescript
const hash = crypto
  .createHash("sha256")
  .update(`${previousHash}${previousTimestamp}${player}${team ?? ""}${nonce}`)
  .digest("hex")
  .substring(0, 32);
```

## Mining Process

Mining a block involves finding a nonce value that produces a hash meeting the difficulty target:

1. **Get Chain State**: Request the current chain state for your team via `GET /teams/:team`
   - Returns: `previousHash`, `previousTimestamp`, and current `difficulty` target

2. **Find Valid Nonce**: Iteratively increment the nonce starting from 0:
   ```typescript
   let nonce = 0;
   while (true) {
     const hash = Block.calculateHash({
       previousHash,
       previousTimestamp,
       player,
       team,
       nonce,
     });
     if (Difficulty.isDifficultyMet(hash, difficultyTarget)) {
       return { hash, nonce };
     }
     nonce++;
   }
   ```

3. **Submit Block**: Once a valid nonce is found, submit the block via `POST /teams/:team/chain`
   - Include: `previousHash`, `player`, `nonce`, `hash`, and optionally `message`

### Mining Validation

When a block is submitted, the server validates:
- The `previousHash` matches the last block's hash
- The `team` matches the chain's team
- The calculated hash matches the provided hash
- The hash meets the current difficulty target
- The block index is sequential

## Difficulty Target

The difficulty system uses a target hash string that blocks must meet or exceed (lexicographically).

### Difficulty Format

The difficulty target is a 32-character hexadecimal string. The difficulty level is determined by:
- **Leading F's**: Each leading `f` represents 1 unit of difficulty
- **Fractional Part**: The first non-`f` hex digit (0-15) represents fractional difficulty (0.0 to 0.9375)

**Examples:**
- `"fffff000000000000000000000000000"` = difficulty 5.0 (default)
- `"fffff100000000000000000000000000"` = difficulty 5.0625
- `"ffffff00000000000000000000000000"` = difficulty 6.0
- `"ffffffffffffffffffffffffffffffff"` = maximum difficulty (32.0)
- `"00000000000000000000000000000000"` = minimum difficulty (0.0)

### Difficulty Adjustment

The difficulty target is dynamically adjusted based on the last 100 blocks:

1. **If chain has < 100 blocks**: Uses default difficulty `"fffff000000000000000000000000000"` (5.0)

2. **If chain has ≥ 100 blocks**: 
   - Calculates average difficulty of the last 100 blocks (minimum 5.0 if chain has < 5 blocks)
   - Calculates average mining interval (time between blocks, minimum 1 second to prevent division by zero)
   - Estimates operations per second: `16^averageDifficulty / averageInterval`
   - Adjusts difficulty to maintain consistent mining rate: `log(opsPerSecond) / log(16)`
   - Minimum difficulty is capped at 5.0

**Formula:**
```typescript
const averageDifficulty = getAverageDifficulty(last100Blocks);
// Returns 5.0 if chain has < 5 blocks
const averageInterval = Math.max(1, getAverageMiningInterval(last100Blocks));
// Minimum 1 second to prevent division by zero
const opsPerSecond = Math.pow(16, averageDifficulty) / averageInterval;
const newDifficulty = Math.max(5, Math.log(opsPerSecond) / Math.log(16));
```

### Difficulty Check

A hash meets the difficulty target if it is **greater than or equal to** the target (lexicographic string comparison):

```typescript
isDifficultyMet(hash: string, difficultyTarget: string): boolean {
  return hash >= difficultyTarget;
}
```

This means higher hex values (closer to `f`) meet the requirement. For example:
- Target: `"fffff000000000000000000000000000"`
- Valid: `"fffff1234..."`, `"ffffffff..."`, `"fffff0000..."`
- Invalid: `"ffffe1234..."`, `"00000000..."`

## Chain Structure

- Each team has its own independent chain
- Chains are linked via `previousHash` references
- Blocks must be submitted sequentially (index 0, 1, 2, ...)
- The server maintains the last 5 blocks in memory for quick access
- Full chains are persisted to disk

## Scoring

### Team Score
A team's score is simply the **length of its chain** (number of blocks).

### Player Score
A player's score is the **total number of blocks they've mined across all chains**.

## API Reference

### Health & Status

#### `GET /health`
Returns server health information including uptime, memory usage, active chains, and total blocks.

**Response:**
```json
{
  "gitHash": "string",
  "startTime": "ISO date string",
  "now": "ISO date string",
  "uptime": 12345,
  "activeChains": 5,
  "totalBlocks": 100,
  "memoryUsage": { ... },
  "dataDirectory": { ... },
  "sseClients": 3
}
```

### Players

#### `GET /players`
Get all players and their scores.

**Response:** `PlayerScore[]`
```json
[
  { "player": "AAA", "score": 10 },
  { "player": "BBB", "score": 5 }
]
```

#### `GET /players/:player/score`
Get a specific player's score.

**Response:**
```json
{
  "player": "AAA",
  "score": 10
}
```

#### `GET /players/:player/messages`
Get all messages mentioning a player across all chains.

**Note:** Messages are filtered to only include blocks where the `message` field starts with `@PLAYER` (e.g., `"@AAA Hello"` mentions player "AAA").

**Response:** `Block[]` (blocks with messages)

### Teams

#### `GET /teams`
Get all teams and their scores.

**Response:** `TeamScore[]`
```json
[
  { "team": "TEAM1", "score": 50 },
  { "team": "TEAM2", "score": 30 }
]
```

#### `GET /teams/:team`
Get chain state needed to mine a new block.

**Response:**
```json
{
  "previousHash": "abc123...",
  "previousTimestamp": 1234567890,
  "difficulty": "fffff000000000000000000000000000"
}
```

#### `GET /teams/:team/score`
Get a specific team's score.

**Response:**
```json
{
  "team": "TEAM1",
  "score": 50
}
```

#### `GET /teams/:team/players`
Get all players who have mined blocks on this team's chain.

**Response:** `string[]`
```json
["AAA", "BBB", "CCC"]
```

#### `GET /teams/:team/messages`
Get all messages in blocks owned by the team.

**Note:** Messages are filtered to only include blocks where the `message` field starts with `#TEAM` (e.g., `"#TEAM1 Hello"` mentions team "TEAM1").

**Response:** `Block[]` (blocks with messages)

#### `POST /teams/:team/chain`
Submit a mined block (genesis or regular).

**Request Body:**
```json
{
  "previousHash": "abc123...",
  "player": "AAA",
  "nonce": 12345,
  "hash": "def456...",
  "message": "Optional message"
}
```

**Response:**
```json
{
  "recent": [ /* last 5 blocks */ ],
  "difficulty": "fffff000000000000000000000000000"
}
```

**Note:** For genesis blocks, use `previousHash: "ffffffffffffffffffffffffffffffff"`.

### Events

#### `GET /events`
Server-Sent Events (SSE) endpoint for real-time updates.

**Events:**
- `connection`: Connection established
- `team_created`: New team chain created (genesis block)
- `block_submitted`: New block added to a chain

**Event Format:**
```
data: {"type": "block_submitted", "payload": { "recent": [...], "difficulty": "..." }}\n\n
```

## Messages & Chat

Blocks can include an optional `message` field for chat functionality. Messages support special formatting:

- **Player Mentions**: Messages starting with `@PLAYER` (e.g., `"@AAA Hello!"`) are considered mentions of that player
- **Team Mentions**: Messages starting with `#TEAM` (e.g., `"#TEAM1 Great work!"`) are considered mentions of that team

The API endpoints for messages filter blocks based on these prefixes:
- `/players/:player/messages` returns blocks with messages starting with `@PLAYER`
- `/teams/:team/messages` returns blocks with messages starting with `#TEAM`

Only blocks with non-empty `message` fields are included in chat results.

## Block Utilities

### Likelihood
Blocks can generate a random likelihood value (0-1) based on their hash:
```typescript
const likelihood = Block.getLikelihood(block);
// Uses last 8 hex digits of hash: parseInt(hash.slice(-8), 16) / 0xffffffff
```

### RNG
Blocks can generate a seeded random number generator:
```typescript
const rng = Block.getRNG(block);
// Uses seedrandom with the block hash as seed
```

## Development

### Project Structure
- `server/`: Backend server implementation
  - `src/block/`: Block structure and utilities
  - `src/chain/`: Chain validation and management
  - `src/miner/`: Mining logic
  - `src/difficulty/`: Difficulty calculation
  - `src/game/`: Game state management
  - `src/server/`: HTTP server and API routes
- `webui/`: Frontend web interface

### Key Constants
- **Genesis Previous Hash**: `"ffffffffffffffffffffffffffffffff"`
- **Default Difficulty**: `"fffff000000000000000000000000000"` (5.0)
- **Min Difficulty**: `0`
- **Max Difficulty**: `32`
- **Hash Length**: `32` hex characters (128 bits)
- **Difficulty Adjustment Window**: `100` blocks
