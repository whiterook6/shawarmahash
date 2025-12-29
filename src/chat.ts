import { Chain } from "./chain";
import { Block } from "./block";

/**
 * Returns the most recent chat messages in descending block order (newest first).
 * Only includes blocks that have a message field.
 */
export const getRecentChatMessages = (chain: Chain): Block[] => {
  return chain
    .filter(block => block.message !== undefined)
    .sort((a, b) => b.index - a.index);
};

/**
 * Returns the most recent chat messages that start with a player name (e.g., "@ASD" or "@TIM").
 * Player names are 3 uppercase letters following the @ symbol.
 * Messages are returned in descending block order (newest first).
 */
export const getRecentPlayerMentions = (chain: Chain, playerName: string): Block[] => {
  return getRecentChatMessages(chain).filter(
    block => block.message?.startsWith(`@${playerName}`)
  );
};

/**
 * Returns the most recent chat messages that start with a team name (e.g., "#ASD" or "#TIM").
 * Team names are 3 uppercase letters following the # symbol.
 * Messages are returned in descending block order (newest first).
 */
export const getRecentTeamMentions = (chain: Chain, playerName: string): Block[] => {
  return getRecentChatMessages(chain).filter(
    block => block.message?.startsWith(`#${playerName}`)
  );
};

