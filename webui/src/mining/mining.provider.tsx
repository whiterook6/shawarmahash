import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MiningContext, type MiningSuccessCallback } from "./mining.context";
import type {
  MiningErrorResponse,
  MiningProgressResponse,
  MiningResponse,
  MiningSuccessResponse,
  StartMiningRequest,
  TeamMiningTarget,
} from "./mining.types";

export const MiningProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState<
    MiningProgressResponse["data"] | null
  >(null);
  const [lastSuccess, setLastSuccess] = useState<
    MiningSuccessResponse["data"] | null
  >(null);
  const [lastError, setLastError] = useState<
    MiningErrorResponse["data"] | null
  >(null);
  const [nextBlockData, queueNextBlockData] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const clearNextBlockData = useCallback(() => {
    queueNextBlockData(undefined);
  }, [queueNextBlockData]);

  const successCallbacksRef = useRef<Set<MiningSuccessCallback>>(new Set());
  const minerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./mining.worker.ts", import.meta.url), {
      type: "module",
    });

    const onMessage = (event: MessageEvent<MiningResponse>) => {
      const response = event.data;
      switch (response.type) {
        case "mining_progress":
          setProgress(response.data);
          setIsMining(true);
          break;
        case "mining_success":
          setLastSuccess(response.data);
          setIsMining(false);
          successCallbacksRef.current.forEach((callback) => {
            callback(response.data);
          });
          break;
        case "mining_error":
          setLastError(response.data);
          setIsMining(false);
          break;
        case "mining_status":
          setIsMining(response.data.status === "active");
          break;
      }
    };

    const onError = (event: ErrorEvent) => {
      setLastError({
        message: event.message ?? "Unknown worker error",
      });
      setIsMining(false);
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    minerRef.current = worker;
    return () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.terminate();
      if (minerRef.current === worker) {
        minerRef.current = null;
      }
    };
  }, []);

  const startMining = useCallback((target: TeamMiningTarget) => {
    if (!minerRef.current) {
      return;
    }

    minerRef.current.postMessage({
      type: "start_mining",
      data: target,
    } as StartMiningRequest);
    setIsMining(true);
  }, []);

  const stopMining = useCallback(() => {
    if (!minerRef.current) {
      return;
    }

    minerRef.current.postMessage({
      type: "stop_mining",
    });
    setIsMining(false);
    setProgress(null);
  }, []);

  const subscribe = useCallback((callback: MiningSuccessCallback) => {
    successCallbacksRef.current.add(callback);
    return () => {
      successCallbacksRef.current.delete(callback);
    };
  }, []);

  const value = useMemo<MiningContext>(() => {
    return {
      isMining,
      progress,
      lastSuccess,
      lastError,
      nextBlockData,

      startMining,
      stopMining,
      subscribe,
      queueNextBlockData,
      clearNextBlockData,
    };
  }, [
    isMining,
    progress,
    lastSuccess,
    lastError,
    nextBlockData,

    startMining,
    stopMining,
    subscribe,
    queueNextBlockData,
    clearNextBlockData,
  ]);

  return (
    <MiningContext.Provider value={value}>{children}</MiningContext.Provider>
  );
};
