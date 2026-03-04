import { describe, it } from "node:test";
import expect from "expect";
import { Chat } from "./chat";
import { DatabaseController } from "../database/database.controller";
import { BlockFaker } from "../block/block.faker";

async function createTestDatabase(): Promise<DatabaseController> {
  const database = new DatabaseController(":memory:");
  await database.runMigrations();
  return database;
}

function insertTestMessage(
  database: DatabaseController,
  params: {
    id: string;
    from_identity: string;
    from_player: string;
    from_team: string;
    to_team: string | null;
    to_player: string | null;
    message: string;
    created_at: number;
  },
): void {
  database
    .prepare(
      `INSERT OR IGNORE INTO players (identity, player, team) VALUES (?, ?, ?)`,
    )
    .run(params.from_identity, params.from_player, params.from_team);

  database
    .prepare(
      `INSERT INTO messages (id, reply_to, from_identity, from_player, from_team, to_team, to_player, message, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      params.id,
      params.from_identity,
      params.from_player,
      params.from_team,
      params.to_team,
      params.to_player,
      params.message,
      params.created_at,
    );
}

describe("Chat", () => {
  describe("getTeamChatMessages", () => {
    it("returns only team chat messages for the given team", async () => {
      const database = await createTestDatabase();
      insertTestMessage(database, {
        id: "a".repeat(32),
        from_identity: "b989bcb4a39c769d",
        from_player: "ABC",
        from_team: "ABC",
        to_team: "ABC",
        to_player: null,
        message: "#ABC Hello, team!",
        created_at: 124,
      });
      insertTestMessage(database, {
        id: "b".repeat(32),
        from_identity: "b989bcb4a39c769e",
        from_player: "DEF",
        from_team: "ABC",
        to_team: null,
        to_player: null,
        message: "Hello, world!",
        created_at: 120,
      });

      const chat = new Chat();
      chat.setDatabase(database);

      const messages = chat.getTeamChatMessages("ABC");

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("#ABC Hello, team!");
      expect(messages[0]).toMatchObject({
        team: "ABC",
        message: "#ABC Hello, team!",
      });

      database.close();
    });

    it("returns empty array when database is not set", () => {
      const chat = new Chat();
      expect(chat.getTeamChatMessages("TST")).toEqual([]);
    });
  });

  describe("getPlayerChatMessages", () => {
    it("returns only player chat messages for the given player", async () => {
      const database = await createTestDatabase();
      insertTestMessage(database, {
        id: "c".repeat(32),
        from_identity: "b989bcb4a39c769d",
        from_player: "TST",
        from_team: "TST",
        to_team: null,
        to_player: "TST",
        message: "@TST Hello, player!",
        created_at: 124,
      });
      insertTestMessage(database, {
        id: "d".repeat(32),
        from_identity: "b989bcb4a39c769e",
        from_player: "TST",
        from_team: "TST",
        to_team: null,
        to_player: null,
        message: "Public message",
        created_at: 120,
      });

      const chat = new Chat();
      chat.setDatabase(database);

      const messages = chat.getPlayerChatMessages("TST");

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("@TST Hello, player!");

      database.close();
    });

    it("returns empty array when database is not set", () => {
      const chat = new Chat();
      expect(chat.getPlayerChatMessages("TST")).toEqual([]);
    });
  });

  describe("getPublicChatMessages", () => {
    it("returns only public chat messages (no team or player prefix)", async () => {
      const database = await createTestDatabase();
      insertTestMessage(database, {
        id: "e".repeat(32),
        from_identity: "b989bcb4a39c769d",
        from_player: "TST",
        from_team: "TST",
        to_team: null,
        to_player: null,
        message: "Hello, everyone!",
        created_at: 120,
      });
      insertTestMessage(database, {
        id: "f".repeat(32),
        from_identity: "b989bcb4a39c769e",
        from_player: "TST",
        from_team: "TST",
        to_team: "TST",
        to_player: null,
        message: "#TST Team only",
        created_at: 124,
      });

      const chat = new Chat();
      chat.setDatabase(database);

      const messages = chat.getPublicChatMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe("Hello, everyone!");

      database.close();
    });

    it("returns empty array when database is not set", () => {
      const chat = new Chat();
      expect(chat.getPublicChatMessages()).toEqual([]);
    });
  });

  describe("handleChatMessage", () => {
    it("inserts message into database when database is set", async () => {
      const database = await createTestDatabase();
      const block = BlockFaker.one({
        hash: "1".repeat(32),
        player: "ABC",
        team: "ABC",
        identity: "b989bcb4a39c769d",
        timestamp: 100,
        data: {
          type: "chat_message",
          message: "Hello, world!",
        },
      });

      const chat = new Chat();
      chat.setDatabase(database);

      chat.handleChatMessage("Hello, world!", block);

      const messages = chat.getPublicChatMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        hashCode: "1".repeat(32),
        player: "ABC",
        team: "ABC",
        identity: "b989bcb4a39c769d",
        message: "Hello, world!",
      });

      database.close();
    });
  });
});
