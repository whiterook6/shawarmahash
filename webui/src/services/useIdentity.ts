import { useCallback, useEffect, useRef, useState } from "react";
import { Api } from "../api";

export interface UseIdentityResult {
  identity?: string;
  isLoading: boolean;
  error?: Error;
  generateNewIdentity: () => Promise<string>;
}

// Self-contained hook: no context/provider required.
export function useIdentity(): UseIdentityResult {
  const [state, setState] = useState<{
    identity?: string;
    isLoading: boolean;
    error?: Error;
  }>({
    identity: undefined,
    isLoading: true,
    error: undefined,
  });

  // Prevent stale responses from overwriting newer identities.
  const requestSeq = useRef(0);
  const generateNewIdentity = useCallback(async (): Promise<string> => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;

    setState((oldState) => ({
      ...oldState,
      isLoading: true,
      error: undefined,
    }));

    try {
      const { identityToken } = await Api.postIdentity();
      if (seq === requestSeq.current) {
        setState((oldState) => ({
          ...oldState,
          identity: identityToken,
          isLoading: false,
          error: undefined,
        }));
      }
      return identityToken;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (seq === requestSeq.current) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
          error: new Error(message),
        }));
      }
      throw e;
    }
  }, []);

  useEffect(() => {
    void generateNewIdentity();
  }, [generateNewIdentity]);

  return {
    identity: state.identity,
    isLoading: state.isLoading,
    error: state.error,
    generateNewIdentity,
  };
}
