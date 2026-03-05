import { useContext, useEffect, useRef, useState } from "react";
import { Api } from "../api/api";
import type { ChatMessageAPIResponse } from "../api/api.types";
import { BroadcastContext } from "../broadcast/broadcast.context";
import type { ChatMessageReceivedMessage } from "../broadcast/broadcast.types";

const TEAM_REGEX = /^#([A-Z]{3})\b/;
const PLAYER_REGEX = /^@([A-Z]{3})\b/;

const MAX_MESSAGES_PER_BUCKET = 25;

type MessageBucket = "public" | "team" | "player";

type ReturnType = {
  public: ChatMessageAPIResponse[];
  team: ChatMessageAPIResponse[];
  player: ChatMessageAPIResponse[];
};

function getBucketFromMessage(message: string): MessageBucket {
  if (TEAM_REGEX.test(message)) return "team";
  if (PLAYER_REGEX.test(message)) return "player";
  return "public";
}

function getTeamFromMessage(message: string): string | undefined {
  const m = message.match(TEAM_REGEX);
  return m?.[1];
}

function getPlayerFromMessage(message: string): string | undefined {
  const m = message.match(PLAYER_REGEX);
  return m?.[1];
}

function normalizePayload(
  payload: ChatMessageReceivedMessage["payload"],
): ChatMessageAPIResponse {
  return {
    hashCode: payload.hashCode,
    player: payload.player,
    team: payload.team,
    identity: payload.identity,
    message: payload.message,
  };
}

export const useChat = (props: {
  team?: string;
  player?: string;
  identity?: string;
}): ReturnType => {
  const { subscribe } = useContext(BroadcastContext);
  const teamRef = useRef(props.team);
  const playerRef = useRef(props.player);

  /**
   * Messages are stored in reading order, most recent last, up to 25 most recent messages.
   */
  const [messages, setMessages] = useState<ReturnType>({
    public: [],
    team: [],
    player: [],
  });

  // Fetch messages when mounted or when team/player change; stale check before applying
  useEffect(() => {
    const { team, player } = props;
    teamRef.current = team;
    playerRef.current = player;

    if (!team || !player) {
      return;
    }

    void Promise.all([
      Api.getPublicChatMessages(), // in reading order, the most recent 25 messages
      Api.getTeamChatMessages(team),
      Api.getPlayerChatMessages(player),
    ]).then(([publicRes, teamRes, playerRes]) => {
      if (teamRef.current === team && playerRef.current === player) {
        setMessages({
          public: publicRes,
          team: teamRes,
          player: playerRes,
        });
      }
    });
  }, [props.team, props.player]);

  // Subscribe to broadcast and append new chat messages
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message.type !== "chat_message_received") return;

      const payload = message.payload;
      const bucket = getBucketFromMessage(payload.message);
      const currentTeam = teamRef.current;
      const currentPlayer = playerRef.current;

      if (bucket === "team") {
        const teamCode = getTeamFromMessage(payload.message);
        if (teamCode !== currentTeam) return;
      } else if (bucket === "player") {
        const playerCode = getPlayerFromMessage(payload.message);
        if (playerCode !== currentPlayer) return;
      }

      const normalized = normalizePayload(payload);
      setMessages((prev) => {
        const list = [...prev[bucket], normalized];
        const trimmed =
          list.length > MAX_MESSAGES_PER_BUCKET
            ? list.slice(-MAX_MESSAGES_PER_BUCKET)
            : list;
        return { ...prev, [bucket]: trimmed };
      });
    });
    return () => unsubscribe();
  }, [subscribe]);

  return {
    public: messages.public,
    team: messages.team,
    player: messages.player,
  };
};
