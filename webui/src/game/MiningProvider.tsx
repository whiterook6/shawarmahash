import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MiningContext } from "../services/MiningContext";
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
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState<
    MiningProgressResponse["data"] | null
  >(null);
  const [lastSuccess, setLastSuccess] = useState<
    MiningSuccessResponse["data"] | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const miner = new Worker(new URL("../services/miner.ts", import.meta.url), {
      type: "module",
    });
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
          Api.submitBlock(msg.data.team, {
            previousHash: msg.data.previousHash,
            player: msg.data.player,
            nonce: msg.data.nonce,
            identity,
            hash: msg.data.hash,
          });
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
