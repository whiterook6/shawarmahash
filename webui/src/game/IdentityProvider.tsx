import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Api } from "../api";
import { IdentityContext } from "../services/IdentityContext";

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent stale responses from overwriting newer identities.
  const requestSeq = useRef(0);

  const generateNewIdentity = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);
    try {
      const { identityToken } = await Api.postIdentity();
      if (seq !== requestSeq.current) return identityToken;
      setIdentity(identityToken);
      return identityToken;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (seq !== requestSeq.current) throw e;
      setError(message);
      throw e;
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void generateNewIdentity();
  }, [generateNewIdentity]);

  const value = useMemo(
    () => ({ identity, isLoading, error, generateNewIdentity }),
    [identity, isLoading, error, generateNewIdentity],
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
