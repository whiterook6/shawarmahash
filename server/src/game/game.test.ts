import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Game } from "./game";
import { Chain } from "../chain/chain";
import expect from "expect";

describe("Game", () => {
  describe("Chat Messages", () => {
    it("Correctly orders chat messages from various chains", () => {
      const chains = new Map<string, Chain>();
      chains.set(
        "TIM",
        Block.Faker.many(10, (index) => {
          return {
            player: "TIM",
            timestamp: 1767315426 + index * 2,
            message: `@ASD Hello ${index}`,
          };
        }),
      );
      chains.set(
        "ASD",
        Block.Faker.many(10, (index) => {
          return {
            player: "ASD",
            timestamp: 1767315426 + index * 2 + 1,
            message: `@TIM Hello ${index}`,
          };
        }),
      );
      const game = new Game();
      game.setChains(chains);
      const chatBlocks = game.getChat();
      const expectedMessages = [
        "@TIM Hello 9",
        "@ASD Hello 9",
        "@TIM Hello 8",
        "@ASD Hello 8",
        "@TIM Hello 7",
        "@ASD Hello 7",
        "@TIM Hello 6",
        "@ASD Hello 6",
        "@TIM Hello 5",
        "@ASD Hello 5",
        "@TIM Hello 4",
        "@ASD Hello 4",
        "@TIM Hello 3",
        "@ASD Hello 3",
        "@TIM Hello 2",
        "@ASD Hello 2",
        "@TIM Hello 1",
        "@ASD Hello 1",
        "@TIM Hello 0",
        "@ASD Hello 0",
      ];
      expect(chatBlocks.map((block) => block.message)).toEqual(
        expectedMessages,
      );
    });
  });

  describe("Scores", () => {
    it("Can get the score for a player", () => {
      const chains = new Map<string, Chain>();
      chains.set(
        "TIM",
        Block.Faker.many(10, (index) => {
          return {
            player: "TIM",
            identity: "b989bcb4a39c769d",
            timestamp: 1767315426 + index * 2,
            message: `@ASD Hello ${index}`,
          };
        }),
      );
      chains.set(
        "ASD",
        Block.Faker.many(5, (index) => {
          return {
            player: "ASD",
            identity: "727f8fc5f18ce498",
            timestamp: 1767315426 + index * 2 + 1,
            message: `@TIM Hello ${index}`,
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
