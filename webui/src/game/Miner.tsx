import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Api } from "../api/api";
import { BroadcastContext } from "../broadcast/broadcast.context";
import type {
  BlockSubmittedMessage,
  BroadcastMessage,
} from "../broadcast/broadcast.types";
import { IdentityContext } from "../identity/identity.context";
import { MiningContext } from "../mining/mining.context";
import type { TeamMiningTarget } from "../mining/mining.types";
import styled from "@emotion/styled";
import {
  estimateProbability,
  estimateRealProgress,
} from "../mining/mining.helpers";
import { Pause, Play } from "lucide-react";

const Div = styled.div`
  background-color: #faede0;
  height: 64px;
  border-radius: 32px;
  padding-left: 16px;
  padding-right: 24px;
  box-sizing: border-box;

  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  box-shadow: 0px 15px 18px 11px rgba(250, 237, 224, 0.2);
`;

const Button = styled.button`
  width: 32px;
  height: 32px;
  background-color: #51a49c;
  box-shadow:
    0px 4px 8px -2px rgba(80, 163, 155, 0.48),
    0px 4px 8px 3px rgba(80, 163, 155, 0.21),
    inset 0px 4px 10px 3px rgba(250, 240, 228, 0.21);
  border-radius: 16px;

  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  border: none;
`;

const Progress = styled.div`
  width: 300px;
  height: 16px;
  border-radius: 8px;
  background-color: white;
  display: flex;
  flex-direction: flex-row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 4px;
`;

const ProgressBar = styled.div`
  height: 8px;
  border-radius: 4px;
  background-color: #295860;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  transition: width 0.1s ease;
`;

export const Miner = () => {
  const { player, team, identity } = useContext(IdentityContext);
  const mining = useContext(MiningContext);
  const broadcast = useContext(BroadcastContext);
  const { connect: connectBroadcast, disconnect: disconnectBroadcast } =
    broadcast;

  const [target, setTarget] = useState<TeamMiningTarget | null>(null);
  const [isTargetLoading, setIsTargetLoading] = useState(false);
  const [autoMine, setAutoMine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastSubmittedHash, setLastSubmittedHash] = useState<string | null>(
    null,
  );

  const fetchTarget = useCallback(async () => {
    if (!team || isTargetLoading) {
      return;
    }

    setIsTargetLoading(true);
    try {
      const t = await Api.getTeam(team);
      setTarget(t);
      return t;
    } catch {
      return null;
    } finally {
      setIsTargetLoading(false);
    }
  }, [team]);

  const submitBlock = useCallback(
    async (blockData: {
      hash: string;
      team: string;
      previousHash: string;
      player: string;
      nonce: number;
    }) => {
      if (!identity) {
        return false;
      }

      // Prevent duplicate submissions
      if (lastSubmittedHash === blockData.hash) {
        return true; // Already submitted
      }

      setIsSubmitting(true);
      console.log(mining.nextBlockData);

      try {
        await Api.submitBlock(blockData.team, {
          previousHash: blockData.previousHash,
          player: blockData.player,
          identity: identity,
          nonce: blockData.nonce,
          hash: blockData.hash,
          data: mining.nextBlockData ?? undefined,
        });
        setLastSubmittedHash(blockData.hash);
        mining.clearNextBlockData();
        return true;
      } catch {
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [identity, lastSubmittedHash, mining.nextBlockData],
  );

  const start = useCallback(async () => {
    if (!player || !team) {
      return;
    }

    setAutoMine(true);
    if (target) {
      return mining.startMining({ ...target, player, team });
    }

    const t = await fetchTarget();
    if (t) {
      mining.startMining({ ...t, player, team });
    }
  }, [fetchTarget, mining, target, player, team]);

  const stop = useCallback(() => {
    setAutoMine(false);
    mining.stopMining();
  }, [mining]);

  // Subscribe to mining success events - automatically submit blocks when mined
  const submitBlockRef = useRef(submitBlock);
  submitBlockRef.current = submitBlock;

  useEffect(() => {
    const unsubscribe = mining.subscribe(async (blockData) => {
      await submitBlockRef.current(blockData);
    });
    return () => unsubscribe();
  }, [mining.subscribe]); // Only depend on the subscribe function, not the whole mining object

  // Track the last block we restarted mining for to prevent loops
  const lastRestartedHashRef = useRef<string | null>(null);

  // After a block is successfully submitted, restart mining if autoMine is enabled
  useEffect(() => {
    if (!lastSubmittedHash) {
      return;
    }

    // Prevent duplicate restarts for the same block
    if (lastRestartedHashRef.current === lastSubmittedHash) {
      return;
    }

    if (!autoMine) {
      return;
    }

    // Verify this matches the current lastSuccess (if it exists)
    if (mining.lastSuccess && lastSubmittedHash !== mining.lastSuccess.hash) {
      return;
    }

    if (!player || !team) {
      return;
    }

    lastRestartedHashRef.current = lastSubmittedHash;
    void (async () => {
      const t = await fetchTarget();
      if (!t) {
        return;
      }
      mining.startMining({ ...t, player, team });
    })();
  }, [
    autoMine,
    fetchTarget,
    mining.startMining,
    lastSubmittedHash,
    player,
    team,
  ]);

  // Listen for broadcast block submissions to update target
  const autoMineRef = useRef(autoMine);
  autoMineRef.current = autoMine;

  const onBlockSubmitted = useCallback(
    (message: BlockSubmittedMessage) => {
      if (!team || !player) {
        return;
      }

      if (message.payload.team === team) {
        const recent = message.payload.recent;
        if (recent.length > 0) {
          const lastBlock = recent[recent.length - 1];
          const newTarget = {
            team: message.payload.team,
            previousHash: lastBlock.hash,
            previousTimestamp: lastBlock.timestamp,
            difficulty: message.payload.difficulty,
          };
          setTarget(newTarget);
          // Clear submission state when we get a new block from the server
          setLastSubmittedHash(null);
          lastRestartedHashRef.current = null; // Reset restart tracking
          // Only restart mining if autoMine is enabled
          if (autoMineRef.current) {
            mining.startMining({
              ...newTarget,
              player,
            });
          }
        }
      }
    },
    [mining.startMining],
  );

  const onBlockSubmittedRef = useRef(onBlockSubmitted);
  onBlockSubmittedRef.current = onBlockSubmitted;

  useEffect(() => {
    const onMessage = (message: BroadcastMessage) => {
      switch (message.type) {
        case "block_submitted":
          onBlockSubmittedRef.current(message);
          break;
      }
    };

    const unsubscribe = broadcast.subscribe(onMessage);
    return () => unsubscribe();
  }, [broadcast]); // onBlockSubmittedRef is intentionally excluded - we use a ref to avoid re-subscribing

  useEffect(() => {
    if (!identity || !player || !team) {
      return;
    }

    connectBroadcast({ team, player, identity });
    return () => {
      disconnectBroadcast();
    };
  }, [connectBroadcast, disconnectBroadcast, identity, player, team]);

  // When identity appears/changes, grab the current target and start mining
  useEffect(() => {
    if (!identity || !player || !team) {
      return;
    }
    setAutoMine(true);
    void (async () => {
      const t = await fetchTarget();
      if (!t) return;
      mining.startMining({ ...t, player, team });
    })();
  }, [identity, fetchTarget, mining.startMining, player, team]);

  let progressWidth = 0;
  if (isSubmitting) {
    progressWidth = 100;
  } else if (
    mining.isMining &&
    mining.progress?.totalHashes &&
    target?.difficulty
  ) {
    progressWidth =
      estimateRealProgress(
        mining.progress.totalHashes,
        estimateProbability(target.difficulty),
      ) * 95;
  }

  return (
    <Div>
      <Button onClick={mining.isMining ? stop : start}>
        {mining.isMining ? <Pause /> : <Play />}
      </Button>
      <Progress>
        <ProgressBar style={{ width: `${progressWidth.toFixed(1)}%` }} />
      </Progress>
    </Div>
  );
};
