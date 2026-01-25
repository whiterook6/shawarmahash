import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Api } from "../api";
import { useMining } from "../mining/useMining.hook";
import type { TeamMiningTarget } from "../types";
import { useBroadcast } from "../broadcast/useBroadcast.hook";
import type {
  BlockSubmittedMessage,
  BroadcastMessage,
} from "../broadcast/broadcast.types";
import { useIdentity } from "../identity/useIdentity.hook";

const PLAYER = "TIM";
const TEAM = "TST";

export function MiningDemo() {
  const identity = useIdentity();
  const mining = useMining();
  const broadcast = useBroadcast();

  const [target, setTarget] = useState<TeamMiningTarget | null>(null);
  const [isTargetLoading, setIsTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [autoMine, setAutoMine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmittedHash, setLastSubmittedHash] = useState<string | null>(
    null,
  );

  const fetchTarget = useCallback(async () => {
    setIsTargetLoading(true);
    setTargetError(null);
    try {
      const t = await Api.getTeam(TEAM);
      setTarget(t);
      return t;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setTargetError(message);
      return null;
    } finally {
      setIsTargetLoading(false);
    }
  }, []);

  const submitBlock = useCallback(
    async (blockData: {
      hash: string;
      team: string;
      previousHash: string;
      player: string;
      nonce: number;
    }) => {
      if (!identity.identity) {
        setSubmitError("No identity available");
        return false;
      }

      // Prevent duplicate submissions
      if (lastSubmittedHash === blockData.hash) {
        return true; // Already submitted
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await Api.submitBlock(blockData.team, {
          previousHash: blockData.previousHash,
          player: blockData.player,
          identity: identity.identity,
          nonce: blockData.nonce,
          hash: blockData.hash,
        });
        setLastSubmittedHash(blockData.hash);
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setSubmitError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [identity.identity, lastSubmittedHash],
  );

  const start = useCallback(async () => {
    setAutoMine(true);
    const t = target ?? (await fetchTarget());
    if (!t) return;
    mining.startMining({ ...t, player: PLAYER, team: TEAM });
  }, [fetchTarget, mining, target]);

  const stop = useCallback(() => {
    setAutoMine(false);
    mining.stopMining();
  }, [mining]);

  // Subscribe to mining success events - automatically submit blocks when mined
  const submitBlockRef = useRef(submitBlock);
  submitBlockRef.current = submitBlock;

  useEffect(() => {
    const unsubscribe = mining.subscribe(async (blockData) => {
      await submitBlockRef.current(blockData);
    });
    return () => unsubscribe();
  }, [mining.subscribe]); // Only depend on the subscribe function, not the whole mining object

  // Track the last block we restarted mining for to prevent loops
  const lastRestartedHashRef = useRef<string | null>(null);

  // After a block is successfully submitted, restart mining if autoMine is enabled
  useEffect(() => {
    if (!lastSubmittedHash) {
      return;
    }

    // Prevent duplicate restarts for the same block
    if (lastRestartedHashRef.current === lastSubmittedHash) {
      return;
    }

    if (!autoMine) {
      return;
    }

    // Verify this matches the current lastSuccess (if it exists)
    if (mining.lastSuccess && lastSubmittedHash !== mining.lastSuccess.hash) {
      return;
    }

    lastRestartedHashRef.current = lastSubmittedHash;
    void (async () => {
      const t = await fetchTarget();
      if (!t) {
        return;
      }
      mining.startMining({ ...t, player: PLAYER, team: TEAM });
    })();
  }, [autoMine, fetchTarget, mining.startMining, lastSubmittedHash]);

  // Listen for broadcast block submissions to update target
  const autoMineRef = useRef(autoMine);
  autoMineRef.current = autoMine;

  const onBlockSubmitted = useCallback(
    (message: BlockSubmittedMessage) => {
      if (message.payload.team === TEAM) {
        const recent = message.payload.recent;
        if (recent.length > 0) {
          const lastBlock = recent[recent.length - 1];
          const newTarget = {
            team: message.payload.team,
            previousHash: lastBlock.hash,
            previousTimestamp: lastBlock.timestamp,
            difficulty: message.payload.difficulty,
          };
          setTarget(newTarget);
          // Clear submission state when we get a new block from the server
          setLastSubmittedHash(null);
          setSubmitError(null);
          lastRestartedHashRef.current = null; // Reset restart tracking
          // Only restart mining if autoMine is enabled
          if (autoMineRef.current) {
            mining.startMining({
              ...newTarget,
              player: PLAYER,
              team: newTarget.team,
            });
          }
        }
      }
    },
    [mining.startMining],
  );

  const onBlockSubmittedRef = useRef(onBlockSubmitted);
  onBlockSubmittedRef.current = onBlockSubmitted;

  useEffect(() => {
    const onMessage = (message: BroadcastMessage) => {
      switch (message.type) {
        case "block_submitted":
          onBlockSubmittedRef.current(message);
          break;
      }
    };

    const unsubscribe = broadcast.subscribe(onMessage);
    return () => unsubscribe();
  }, [broadcast]); // onBlockSubmittedRef is intentionally excluded - we use a ref to avoid re-subscribing

  // When identity appears/changes, grab the current target and start mining
  useEffect(() => {
    if (!identity.identity) {
      return;
    }
    setAutoMine(true);
    void (async () => {
      const t = await fetchTarget();
      if (!t) return;
      mining.startMining({ ...t, player: PLAYER, team: TEAM });
    })();
  }, [identity.identity, fetchTarget, mining.startMining]);

  const status = useMemo(() => {
    if (isTargetLoading) {
      return "Fetching target...";
    }
    if (isSubmitting) {
      return "Submitting block...";
    }
    if (targetError) {
      return "Target fetch failed";
    }
    if (mining.isMining) {
      return "Mining…";
    }
    return "Idle";
  }, [isTargetLoading, isSubmitting, mining.isMining, targetError]);

  return (
    <div className="app" style={{ marginTop: "1.5rem" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <strong>Demo workflow</strong>
        <div style={{ marginTop: "0.5rem" }}>
          <div>
            <strong>Player</strong>: {PLAYER}{" "}
            <strong style={{ marginLeft: "0.75rem" }}>Team</strong>: {TEAM}
          </div>
          <div>
            <strong>Status</strong>: {status}
          </div>
          <div>
            <strong>Identity</strong>: {identity.identity}
          </div>
          <div>
            <strong>SSE Connection</strong>:{" "}
            <span
              style={{ color: broadcast.isConnected ? "#16a34a" : "#dc2626" }}
            >
              {broadcast.isConnected ? "● Connected" : "○ Disconnected"}
            </span>
            {broadcast.connectionError && (
              <span style={{ marginLeft: "0.5rem", color: "#dc2626" }}>
                ({broadcast.connectionError.message})
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={() => void start()} disabled={isTargetLoading}>
          Start
        </button>
        <button onClick={stop} disabled={!mining.isMining}>
          Stop
        </button>
        <button onClick={() => void fetchTarget()} disabled={isTargetLoading}>
          Refresh target
        </button>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div>
          <strong>Target</strong>:{" "}
          {target ? (
            <span>
              prevHash={target.previousHash.slice(0, 8)}… ts=
              {target.previousTimestamp} diff={target.difficulty}
            </span>
          ) : (
            "none"
          )}
        </div>
        {targetError ? (
          <div style={{ marginTop: "0.5rem", color: "#7f1d1d" }}>
            {targetError}
          </div>
        ) : null}
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div>
          <strong>Progress</strong>:{" "}
          {mining.progress
            ? `${mining.progress.hashesPerSecond} H/s (best ${mining.progress.bestHash})`
            : "none"}
        </div>
        <div>
          <strong>Total hashes</strong>:{" "}
          {mining.progress?.totalHashes != null
            ? mining.progress.totalHashes.toLocaleString()
            : "—"}
        </div>
        <div>
          <strong>Last success</strong>:{" "}
          {mining.lastSuccess
            ? `nonce=${mining.lastSuccess.nonce} hash=${mining.lastSuccess.hash}`
            : "none"}
        </div>
        {mining.lastError ? (
          <div style={{ marginTop: "0.5rem", color: "#7f1d1d" }}>
            {mining.lastError.message}
          </div>
        ) : null}
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div>
          <strong>Submission</strong>:{" "}
          {lastSubmittedHash ? (
            <span style={{ color: "#16a34a" }}>
              ✓ Submitted (hash: {lastSubmittedHash.slice(0, 8)}…)
            </span>
          ) : mining.lastSuccess ? (
            <span style={{ color: "#ca8a04" }}>
              ⚠ Block mined, not yet submitted
            </span>
          ) : (
            "none"
          )}
        </div>
        {submitError ? (
          <div style={{ marginTop: "0.5rem", color: "#7f1d1d" }}>
            Submission error: {submitError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
