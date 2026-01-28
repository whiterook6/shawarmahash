import { useCallback, useEffect, useMemo, useState } from "react";
import { IdentityContext } from "./identity.context";
import { Api } from "../api/api";
import { useApi } from "../api/useApi.hook";
import type { IdentityAPIResponse } from "../api/api.types";

export const IdentityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [identityPromise, setIdentityPromise] = useState<
    Promise<IdentityAPIResponse> | undefined
  >();
  const [state, setState] = useState<{ team: string; player: string }>({
    team: "TST",
    player: "TIM",
  });
  const setTeam = useCallback((team: string) => {
    setState((old) => ({
      ...old,
      team,
    }));
  }, []);
  const setPlayer = useCallback((player: string) => {
    setState((old) => ({
      ...old,
      player,
    }));
  }, []);
  useEffect(() => {
    setIdentityPromise(async () => {
      const localStorageIdentity = localStorage.getItem("identity");
      if (localStorageIdentity !== null) {
        return {
          identityToken: localStorageIdentity,
        } as IdentityAPIResponse;
      }

      const p = Api.postIdentity();
      const { identityToken } = await p;
      localStorage.setItem("identity", identityToken);
      return {
        identityToken,
      } as IdentityAPIResponse;
    });
  }, []);

  const {
    result: identity,
    isWaiting: isGeneratingIdentity,
    error: errorGeneratingIdentity,
  } = useApi(identityPromise);

  const generateNewIdentity = useCallback(async () => {
    if (isGeneratingIdentity) {
      return;
    }

    setIdentityPromise(Api.postIdentity());
  }, [isGeneratingIdentity]);

  const value = useMemo(
    () => ({
      identity: identity?.identityToken,
      isGeneratingIdentity,
      errorGeneratingIdentity,
      generateNewIdentity,
      setTeam,
      setPlayer,
      team: state.team,
      player: state.player,
    }),
    [
      identity,
      isGeneratingIdentity,
      errorGeneratingIdentity,
      generateNewIdentity,
      setTeam,
      setPlayer,
      state.team,
      state.player,
    ],
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
};
