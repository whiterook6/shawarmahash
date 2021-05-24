import { Block } from "./Block";

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
}

export const getTeams = async () => {
  const response = await fetch("/api/teams");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
};

export const getPlayers = async () => {
  const response = await fetch("/api/players");
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body);
  }
  return response.json();
};

export const submitBlock = async (block: Block) => {
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
};
