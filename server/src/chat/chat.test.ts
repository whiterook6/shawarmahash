import { describe, it } from "node:test";
import expect from "expect";
import { Chain } from "../chain/chain";
import { BlockFaker } from "../block/block.faker";
import { Chat } from "./chat";

describe("Chat", () => {
  describe("getTeamChatMessages", () => {
    it("returns only team chat messages for the given team", () => {
      const chat = new Chat();
      const chains = new Map<string, Chain>();
      chains.set("TST", []);
      chains.set("ABC", [
        BlockFaker.one({
          timestamp: 124,
          team: "ABC",
          data: {
            type: "chat_message",
            message: "#ABC Hello, team!",
          },
        }),
        BlockFaker.one({
          timestamp: 120,
          data: {
            type: "chat_message",
            message: "Hello, world!",
          },
        }),
      ]);
      chat.setChains(chains);

      const messages = chat.getTeamChatMessages("ABC");

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("#ABC Hello, team!");
      expect(messages[0]).toMatchObject({
        team: "ABC",
        message: "#ABC Hello, team!",
      });
    });

    it("returns empty array when chains are not set", () => {
      const chat = new Chat();
      expect(chat.getTeamChatMessages("TST")).toEqual([]);
    });
  });

  describe("getPlayerChatMessages", () => {
    it("returns only player chat messages for the given player", () => {
      const chat = new Chat();
      const chains = new Map<string, Chain>();
      chains.set("TST", [
        BlockFaker.one({
          timestamp: 124,
          data: {
            type: "chat_message",
            message: "@TST Hello, player!",
          },
        }),
        BlockFaker.one({
          timestamp: 120,
          data: {
            type: "chat_message",
            message: "Public message",
          },
        }),
      ]);
      chat.setChains(chains);

      const messages = chat.getPlayerChatMessages("TST");

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("@TST Hello, player!");
    });

    it("returns empty array when chains are not set", () => {
      const chat = new Chat();
      expect(chat.getPlayerChatMessages("TST")).toEqual([]);
    });
  });

  describe("getPublicChatMessages", () => {
    it("returns only public chat messages (no team or player prefix)", () => {
      const chat = new Chat();
      const chains = new Map<string, Chain>();
      chains.set("TST", [
        BlockFaker.one({
          timestamp: 120,
          data: {
            type: "chat_message",
            message: "Hello, everyone!",
          },
        }),
        BlockFaker.one({
          timestamp: 124,
          data: {
            type: "chat_message",
            message: "#TST Team only",
          },
        }),
      ]);
      chat.setChains(chains);

      const messages = chat.getPublicChatMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("Hello, everyone!");
    });

    it("returns empty array when chains are not set", () => {
      const chat = new Chat();
      expect(chat.getPublicChatMessages()).toEqual([]);
    });
  });
});
