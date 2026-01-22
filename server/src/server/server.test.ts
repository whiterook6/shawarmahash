import test, { describe, before, after } from "node:test";
import { Game } from "../game/game";
import { createServer } from "./server";
import { Broadcast } from "../broadcast/broadcast";
import { Data } from "../data/data";
import { join } from "node:path";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import expect from "expect";
import { EnvController } from "../env";
import { FastifyInstance } from "fastify";

describe("Server", () => {
  let tempDir: string;
  let dataDir: string;

  let game: Game;
  let broadcast: Broadcast;
  let data: Data;
  let server: FastifyInstance;

  before(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "shawarmahash-")); // unique folder
    dataDir = join(tempDir, "data");
    await mkdir(dataDir, { recursive: true });

    // Tests don't call EnvController.verifyEnv(), so seed the minimum env needed
    // for routes that use it (cookies, derived identity, etc).
    EnvController.env = {
      GIT_HASH: "test-githash",
      NODE_ENV: "development",
      IDENTITY_SECRET: "test-secret",
    };

    data = new Data(dataDir);
    broadcast = new Broadcast();

    game = new Game();
    server = createServer(game, broadcast, data);
    await server.ready();
  });

  after(async () => {
    await Promise.all([
      server.close(),
      rm(dataDir, { recursive: true, force: true }),
    ]);
  });

  test("It can get top players", async (context) => {
    const expected = [
      {
        player: "AAA",
        identity: "b989bcb4a39c769d",
        score: 100,
      },
      {
        player: "BBB",
        identity: "b989bcb4a39c769e",
        score: 50,
      },
      {
        player: "CCC",
        identity: "b989bcb4a39c769f",
        score: 25,
      },
    ];
    context.mock.method(game, "getTopPlayers", () => expected);

    const response = await server.inject({
      method: "GET",
      url: "/api/players/top",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        {
          player: "AAA",
          identity: "b989bcb4a39c769d",
          score: 100,
        },
        {
          player: "BBB",
          identity: "b989bcb4a39c769e",
          score: 50,
        },
        {
          player: "CCC",
          identity: "b989bcb4a39c769f",
          score: 25,
        },
      ]),
    );
  });

  test("It can get top players when there are none", async (context) => {
    context.mock.method(game, "getTopPlayers", () => []);

    const response = await server.inject({
      method: "GET",
      url: "/api/players/top",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  test("It an get top teams", async (context) => {
    context.mock.method(game, "getTopTeams", () => [
      {
        team: "AAA",
        score: 100,
      },
      {
        team: "BBB",
        score: 50,
      },
    ]);

    const response = await server.inject({
      method: "GET",
      url: "/api/teams/top",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        team: "AAA",
        score: 100,
      },
      {
        team: "BBB",
        score: 50,
      },
    ]);
  });

  test("It can get top teams when there are none", async (context) => {
    context.mock.method(game, "getTopTeams", () => []);

    const response = await server.inject({
      method: "GET",
      url: "/api/teams/top",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  test("It can get players and their scores", async (context) => {
    context.mock.method(game, "getAllPlayerScores", () => [
      {
        player: "AAA",
        identity: "b989bcb4a39c769d",
        score: 100,
      },
      {
        player: "BBB",
        identity: "b989bcb4a39c769e",
        score: 50,
      },
    ]);

    const response = await server.inject({
      method: "GET",
      url: "/api/players",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        player: "AAA",
        identity: "b989bcb4a39c769d",
        score: 100,
      },
      {
        player: "BBB",
        identity: "b989bcb4a39c769e",
        score: 50,
      },
    ]);
  });
});
