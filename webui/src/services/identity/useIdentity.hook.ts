import { useCallback, useEffect, useRef, useState } from "react";
import { Api } from "../../api";
import { identityStorage } from "./identityStorage";

export const useIdentity = (): {
  identity?: string;
  isLoading: boolean;
  error?: Error;
  generateNewIdentity: () => Promise<string>;
} => {
  const [state, setState] = useState<{
    identity?: string;
    isLoading: boolean;
    error?: Error;
  }>(() => {
    // Initialize with stored identity if available
    const stored = identityStorage.get();
    return {
      identity: stored || undefined,
      isLoading: !stored, // Only loading if we don't have a stored identity
      error: undefined,
    };
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
        // Save to localStorage when we get a new identity
        identityStorage.set(identityToken);
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
    // Only generate a new identity if we don't have a stored one
    if (!state.identity) {
      void generateNewIdentity();
    }
  }, [generateNewIdentity, state.identity]);

  return {
    identity: state.identity,
    isLoading: state.isLoading,
    error: state.error,
    generateNewIdentity,
  };
};
