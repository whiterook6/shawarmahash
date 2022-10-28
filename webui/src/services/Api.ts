import { Block } from "../Block";
import { IChatMessage } from "./ChatContext";

export const getBlocks = async (): Promise<Block[]> => {
  const response = await fetch("/api/blocks/recent");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
};

export const getTarget = async (): Promise<string> => {
  const response = await fetch("/api/mining/target");
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body);
  }
  return body;
};

export const getTeams = async (): Promise<string[]> => {
  const response = await fetch("/api/teams");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json() as Promise<string[]>;
};

export const getPlayers = async (): Promise<string[]> => {
  const response = await fetch("/api/players");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json() as Promise<string[]>;
};

export const submitBlock = async (block: Block): Promise<string> => {
  const response = await fetch("/api/blocks", {
    body: JSON.stringify(block),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  const { newTarget } = await response.json();
  return newTarget as string;
};

export const getChatMessages = async (): Promise<IChatMessage[]> => {
  const response = await fetch("/api/chat/recent");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json() as Promise<IChatMessage[]>;
};

export const postChatMessage = async (message: {
  fromPlayer: string;
  fromTeam?: string;
  toPlayer?: string;
  toTeam?: string;
  content: string;
  afterHash?: string;
}): Promise<IChatMessage> => {
  const response = await fetch("/api/chat", {
    body: JSON.stringify(message),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json() as Promise<IChatMessage>;
}
