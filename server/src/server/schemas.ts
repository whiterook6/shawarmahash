const schemaRefs = {
  playerName: {
    type: "string",
    minLength: 3,
    maxLength: 3,
    pattern: "^[A-Z]{3}$",
  },
  teamName: {
    type: "string",
    minLength: 3,
    maxLength: 3,
    pattern: "^[A-Z]{3}$",
  },
  identity: {
    type: "string",
    minLength: 16,
    maxLength: 16,
    pattern: "^[0-9a-f]{16}$",
  },
  hashCode: {
    type: "string",
    minLength: 32,
    maxLength: 32,
    pattern: "^[0-9a-f]{32}$",
  },
  nonce: {
    type: "integer",
    minimum: 1,
  },
  timestamp: {
    type: "integer",
    minimum: 1,
  },
} as const;

const chatMessageItem = {
  type: "object",
  properties: {
    hashCode: schemaRefs.hashCode,
    player: schemaRefs.playerName,
    team: schemaRefs.teamName,
    identity: schemaRefs.identity,
    message: { type: "string" },
  },
  required: ["hashCode", "player", "team", "identity", "message"],
  additionalProperties: false,
} as const;

export const schemas = {
  postIdentity: {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            identityToken: schemaRefs.identity,
          },
          required: ["identityToken"],
          additionalProperties: false,
        },
      },
    },
  },
  getHealth: {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            gitHash: { type: "string" },
            startTime: { type: "string" },
            now: { type: "string" },
            uptime: { type: "number" },
            activeChains: { type: "number" },
            totalBlocks: { type: "number" },
            memoryUsage: {
              type: "object",
              properties: {
                rss: { type: "number" },
                heapTotal: { type: "number" },
                heapUsed: { type: "number" },
                external: { type: "number" },
              },
              required: ["rss", "heapTotal", "heapUsed", "external"],
              additionalProperties: false,
            },
            databaseStatus: { type: "boolean" },
            sseClients: { type: "number" },
          },
          required: [
            "gitHash",
            "startTime",
            "now",
            "uptime",
            "activeChains",
            "totalBlocks",
            "memoryUsage",
            "databaseStatus",
            "sseClients",
          ],
          additionalProperties: false,
        },
      },
    },
  },
  getPlayers: {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              player: schemaRefs.playerName,
              identity: schemaRefs.identity,
              score: { type: "number" },
            },
            required: ["player", "identity", "score"],
            additionalProperties: false,
          },
          additionalItems: false,
        },
      },
    },
  },
  getPlayerScore: {
    schema: {
      Params: {
        type: "object",
        properties: {
          identity: schemaRefs.identity,
        },
        required: ["identity"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            identity: schemaRefs.identity,
            score: { type: "number" },
          },
          required: ["identity", "score"],
          additionalProperties: false,
        },
      },
    },
  },
  getTopPlayers: {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              player: schemaRefs.playerName,
              identity: schemaRefs.identity,
              score: { type: "number" },
            },
            required: ["player", "identity", "score"],
            additionalProperties: false,
          },
          additionalItems: false,
        },
      },
    },
  },
  getTeams: {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              team: schemaRefs.teamName,
              score: { type: "number" },
            },
            required: ["team", "score"],
            additionalProperties: false,
          },
          additionalItems: false,
        },
      },
    },
  },
  getTeamScore: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            team: schemaRefs.teamName,
            score: { type: "number" },
          },
          required: ["team", "score"],
          additionalProperties: false,
        },
      },
    },
  },
  getTopTeams: {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              team: schemaRefs.teamName,
              score: { type: "number" },
            },
            required: ["team", "score"],
            additionalProperties: false,
          },
          additionalItems: false,
        },
      },
    },
  },
  getTeamPlayers: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: schemaRefs.playerName,
          additionalItems: false,
        },
      },
    },
  },
  getTeam: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            team: schemaRefs.teamName,
            previousHash: schemaRefs.hashCode,
            previousTimestamp: { type: "number" },
            difficulty: { type: "string" },
          },
          required: ["team", "previousHash", "previousTimestamp", "difficulty"],
          additionalProperties: false,
        },
      },
    },
  },
  submitBlock: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
        },
        required: ["team"],
        additionalProperties: false,
      },
      Body: {
        type: "object",
        properties: {
          previousHash: schemaRefs.hashCode,
          player: schemaRefs.playerName,
          identity: schemaRefs.identity,
          nonce: schemaRefs.nonce,
          hash: schemaRefs.hashCode,
          data: {
            type: "object",
            additionalProperties: true,
          },
        },
        required: ["previousHash", "player", "identity", "nonce", "hash"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            recent: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  player: schemaRefs.playerName,
                  team: schemaRefs.teamName,
                  timestamp: schemaRefs.timestamp,
                  nonce: schemaRefs.nonce,
                  hash: schemaRefs.hashCode,
                  previousHash: schemaRefs.hashCode,
                  data: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
                required: [
                  "index",
                  "player",
                  "team",
                  "timestamp",
                  "nonce",
                  "hash",
                  "previousHash",
                ],
                additionalProperties: false,
              },
              additionalItems: false,
            },
            difficulty: { type: "string" },
          },
          required: ["recent", "difficulty"],
          additionalProperties: false,
        },
      },
    },
  },
  getEvents: {
    schema: {
      querystring: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
          player: schemaRefs.playerName,
          identity: schemaRefs.identity,
        },
        required: ["team", "player", "identity"],
        additionalProperties: false,
      },
    },
  },
  getPublicChatMessages: {
    schema: {
      response: {
        200: {
          type: "array",
          items: chatMessageItem,
          additionalItems: false,
        },
      },
    },
  },
  getTeamChatMessages: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: schemaRefs.teamName,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: chatMessageItem,
          additionalItems: false,
        },
      },
    },
  },
  getPlayerChatMessages: {
    schema: {
      Params: {
        type: "object",
        properties: {
          player: schemaRefs.playerName,
        },
        required: ["player"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: chatMessageItem,
          additionalItems: false,
        },
      },
    },
  },
};
