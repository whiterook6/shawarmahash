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

export const MiningProvider = ({
  minerWorker,
  children,
}: {
  minerWorker: Worker;
  children: React.ReactNode;
}) => {
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
  const successCallbacksRef = useRef<Set<MiningSuccessCallback>>(new Set());

  useEffect(() => {
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

    minerWorker.addEventListener("message", onMessage);
    minerWorker.addEventListener("error", onError);
    return () => {
      minerWorker.removeEventListener("message", onMessage);
      minerWorker.removeEventListener("error", onError);
    };
  }, [minerWorker]);

  const startMining = useCallback(
    (target: TeamMiningTarget) => {
      minerWorker.postMessage({
        type: "start_mining",
        data: target,
      } as StartMiningRequest);
      setIsMining(true);
    },
    [minerWorker],
  );

  const stopMining = useCallback(() => {
    minerWorker.postMessage({
      type: "stop_mining",
    });
    setIsMining(false);
  }, [minerWorker]);

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
      startMining,
      stopMining,
      subscribe,
    };
  }, [
    isMining,
    progress,
    lastSuccess,
    lastError,
    startMining,
    stopMining,
    subscribe,
  ]);

  return (
    <MiningContext.Provider value={value}>{children}</MiningContext.Provider>
  );
};
