// Web Worker for mining blocks
// Uses Web Subtle Crypto API for SHA-256 hashing

type StartMiningMessage = {
  type: "START_MINING";
  team: string;
  player: string;
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
};

type StopMiningMessage = {
  type: "STOP_MINING";
};

type WorkerMessage = StartMiningMessage | StopMiningMessage;

type HashFoundMessage = {
  type: "HASH_FOUND";
  hash: string;
  nonce: number;
  team: string;
  player: string;
};

type ProgressMessage = {
  type: "PROGRESS";
  hashesPerSecond: number;
};

// Calculate SHA-256 hash using Web Crypto API
async function calculateHash(
  previousHash: string,
  previousTimestamp: number,
  player: string,
  team: string,
  nonce: number,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${previousHash}${previousTimestamp}${player}${team ?? ""}${nonce}`,
  );

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Truncate to 32 characters
  return hashHex.substring(0, 32);
}

// Check if hash meets difficulty target (lexicographic comparison)
function isDifficultyMet(hash: string, difficultyTarget: string): boolean {
  return hash >= difficultyTarget;
}

let isMining = false;
let shouldStop = false;
let hashCount = 0;
let progressIntervalId: number | null = null;
let startTime = 0;

async function startMining(params: {
  team: string;
  player: string;
  previousHash: string;
  previousTimestamp: number;
  difficulty: string;
}) {
  // Stop any existing mining
  shouldStop = true;
  if (progressIntervalId !== null) {
    self.clearInterval(progressIntervalId);
    progressIntervalId = null;
  }

  // Reset state
  isMining = true;
  shouldStop = false;
  hashCount = 0;
  startTime = Date.now();

  const { team, player, previousHash, previousTimestamp, difficulty } = params;

  // Set up progress reporting (every second)
  progressIntervalId = self.setInterval(() => {
    if (!isMining) return;

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const hashesPerSecond = hashCount / elapsedSeconds;

    const message: ProgressMessage = {
      type: "PROGRESS",
      hashesPerSecond,
    };
    self.postMessage(message);

    // Reset counter for next interval
    hashCount = 0;
    startTime = Date.now();
  }, 1000);

  // Start mining loop
  let nonce = 0;
  while (isMining && !shouldStop) {
    try {
      const hash = await calculateHash(
        previousHash,
        previousTimestamp,
        player,
        team,
        nonce,
      );

      hashCount++;

      if (isDifficultyMet(hash, difficulty)) {
        // Found valid hash!
        const message: HashFoundMessage = {
          type: "HASH_FOUND",
          hash,
          nonce,
          team,
          player,
        };
        self.postMessage(message);

        // Stop mining after finding a hash
        isMining = false;
        shouldStop = false;
        if (progressIntervalId !== null) {
          self.clearInterval(progressIntervalId);
          progressIntervalId = null;
        }
        break;
      }

      nonce++;
    } catch (error) {
      console.error("Error during mining:", error);
      isMining = false;
      shouldStop = false;
      if (progressIntervalId !== null) {
        self.clearInterval(progressIntervalId);
        progressIntervalId = null;
      }
      break;
    }
  }
}

function stopMining() {
  shouldStop = true;
  isMining = false;
  if (progressIntervalId !== null) {
    self.clearInterval(progressIntervalId);
    progressIntervalId = null;
  }
}

// Handle messages from main thread
self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "START_MINING":
      startMining({
        team: message.team,
        player: message.player,
        previousHash: message.previousHash,
        previousTimestamp: message.previousTimestamp,
        difficulty: message.difficulty,
      });
      break;
    case "STOP_MINING":
      stopMining();
      break;
    default:
      console.warn("Unknown message type:", message);
  }
});
