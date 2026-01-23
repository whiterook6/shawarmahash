import { useCallback, useEffect, useMemo, useState } from "react";
import { Api } from "../api";
import { useMining } from "../services/miner/useMining.hook";
import type { TeamMiningTarget } from "../types";

const PLAYER = "TIM";
const TEAM = "TST";

export function MiningDemo({ identity }: { identity: string }) {
  const mining = useMining();
  const [target, setTarget] = useState<TeamMiningTarget | null>(null);
  const [isTargetLoading, setIsTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [autoMine, setAutoMine] = useState(true);

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

  // When identity appears/changes, grab the current target and start mining.
  useEffect(() => {
    setAutoMine(true);
    void (async () => {
      const t = await fetchTarget();
      if (!t) return;
      mining.startMining({ ...t, player: PLAYER, team: TEAM });
    })();
  }, [identity]);

  // After a mined block, refresh target and keep going if autoMine is enabled.
  useEffect(() => {
    if (!mining.lastSuccess) return;
    if (!autoMine) return;
    void (async () => {
      const t = await fetchTarget();
      if (!t) return;
      mining.startMining({ ...t, player: PLAYER, team: TEAM });
    })();
  }, [autoMine, fetchTarget, mining, mining.lastSuccess]);

  const status = useMemo(() => {
    if (isTargetLoading) return "Fetching target...";
    if (targetError) return "Target fetch failed";
    if (mining.isMining) return "Mining…";
    return "Idle";
  }, [isTargetLoading, mining.isMining, targetError]);

  return (
    <div style={{ marginTop: "1.5rem" }}>
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
            <strong>Identity</strong>: {identity}
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
            {mining.lastError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
