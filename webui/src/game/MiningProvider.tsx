import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MiningContext } from "../services/miner/MiningContext";
import type {
  MiningProgressResponse,
  MiningResponse,
  MiningSuccessResponse,
  StartMiningRequest,
  StopMiningRequest,
} from "../types";
import { Api } from "../api";

export const MiningProvider = ({
  identity,
  children,
}: {
  identity: string;
  children: React.ReactNode;
}) => {
  const minerRef = useRef<Worker | null>(null);
  const identityRef = useRef(identity);
  const activeTargetRef = useRef<{
    previousHash: string;
    previousTimestamp: number;
    difficulty: string;
    player: string;
    team: string;
  } | null>(null);

  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState<
    MiningProgressResponse["data"] | null
  >(null);
  const [lastSuccess, setLastSuccess] = useState<
    MiningSuccessResponse["data"] | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    const miner = new Worker(
      new URL("../services/miner/miner.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    minerRef.current = miner;

    miner.onmessage = (event: MessageEvent<MiningResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case "mining_progress":
          setProgress(msg.data);
          return;
        case "mining_success":
          setLastSuccess(msg.data);
          setIsMining(false);
          // NOTE: `mining_success` does not include `previousHash`, so we submit
          // against the most recent target we started mining.
          {
            const target = activeTargetRef.current;
            if (!target) return;
            void Api.submitBlock(target.team, {
              previousHash: target.previousHash,
              player: msg.data.player,
              nonce: msg.data.nonce,
              identity: identityRef.current,
              hash: msg.data.hash,
            }).catch((e) => {
              const message = e instanceof Error ? e.message : String(e);
              setLastError(message);
            });
          }
          return;
        case "mining_error":
          setLastError(msg.data.message);
          setIsMining(false);
          return;
        case "mining_status":
          setIsMining(msg.data.status === "active");
          return;
        default:
          return;
      }
    };

    miner.onerror = (event) => {
      setLastError(event.message ?? "Worker error");
      setIsMining(false);
    };

    return () => {
      miner.terminate();
      minerRef.current = null;
    };
  }, []);

  const post = useCallback(
    (message: StartMiningRequest | StopMiningRequest) => {
      minerRef.current?.postMessage(message);
    },
    [],
  );

  const startMining = useCallback(
    (target: {
      previousHash: string;
      previousTimestamp: number;
      difficulty: string;
      player: string;
      team: string;
    }) => {
      setLastError(null);
      setLastSuccess(null);
      setIsMining(true);
      activeTargetRef.current = target;

      post({
        type: "start_mining",
        data: target,
      });
    },
    [post],
  );

  const stopMining = useCallback(() => {
    post({ type: "stop_mining" });
    setIsMining(false);
  }, [post]);

  const value = useMemo(
    () => ({
      isMining,
      progress,
      lastSuccess,
      lastError,
      startMining,
      stopMining,
    }),
    [isMining, progress, lastSuccess, lastError, startMining, stopMining],
  );

  return (
    <MiningContext.Provider value={value}>{children}</MiningContext.Provider>
  );
};
