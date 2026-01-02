import { Chain } from "../chain/chain";
import { Block } from "../block/block";

export const Chat = {
  /**
   * Returns blocks that have a message field.
   */
  getChatMessages: (chain: Chain): Block[] => {
    return chain
      .filter((block) => block.message !== undefined && block.message.length > 0);
  },

  /**
   * Returns chat messages that start with a player name (e.g., "@ASD" or "@TIM").
   * Player names are 3 uppercase letters following the @ symbol.
   */
  getPlayerMentions: (chain: Chain, playerName: string): Block[] => {
    return Chat.getChatMessages(chain).filter((block) =>
      block.message!.startsWith(`@${playerName}`),
    );
  },

  /**
   * Returns chat messages that start with a team name (e.g., "#ASD" or "#TIM").
   * Team names are 3 uppercase letters following the # symbol.
   */
  getTeamMentions: (chain: Chain, teamName: string): Block[] => {
    return Chat.getChatMessages(chain).filter((block) =>
      block.message!.startsWith(`#${teamName}`),
    );
  },
};
