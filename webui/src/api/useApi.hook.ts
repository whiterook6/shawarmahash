import { useEffect, useRef, useState } from "react";

type State<T> = {
  result?: T;
  error?: Error;
  isWaiting: boolean;
  hasRun?: boolean;
};

export const useApi = <T>(promise: Promise<T> | undefined): State<T> => {
  const [state, setState] = useState<State<T>>({
    isWaiting: false,
    result: undefined,
    error: undefined,
    hasRun: false,
  });

  const promiseRef = useRef<Promise<T> | undefined>(promise);

  useEffect(() => {
    promiseRef.current = promise;

    if (!promise) {
      setState({
        isWaiting: false,
        result: undefined,
        error: undefined,
        hasRun: false,
      });
      return;
    }

    setState({
      isWaiting: true,
      result: undefined,
      error: undefined,
      hasRun: false,
    });

    promise
      .then((result) => {
        if (promiseRef.current !== promise) {
          return;
        }

        setState({
          isWaiting: false,
          result: result,
          error: undefined,
          hasRun: true,
        });
      })
      .catch((error) => {
        if (promiseRef.current !== promise) {
          return;
        }

        setState({
          isWaiting: false,
          result: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
          hasRun: true,
        });
      });
  }, [promise]);

  return state;
};
