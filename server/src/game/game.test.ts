import { describe, it } from "node:test";
import { Game } from "./game";
import { Chain } from "../chain/chain";
import expect from "expect";
import { BlockFaker } from "../block/block.faker";

describe("Game", () => {
  describe("Scores", () => {
    it("Can get the score for a player", () => {
      const chains = new Map<string, Chain>();
      chains.set(
        "TIM",
        BlockFaker.many(10, (index) => {
          return {
            player: "TIM",
            identity: "b989bcb4a39c769d",
            timestamp: 1767315426 + index * 2,
          };
        }),
      );
      chains.set(
        "ASD",
        BlockFaker.many(5, (index) => {
          return {
            player: "ASD",
            identity: "727f8fc5f18ce498",
            timestamp: 1767315426 + index * 2 + 1,
          };
        }),
      );
      const game = new Game();
      game.setChains(chains);
      expect(game.getPlayerScore("b989bcb4a39c769d")).toBe(10);
      expect(game.getPlayerScore("727f8fc5f18ce498")).toBe(5);
    });
  });
});
