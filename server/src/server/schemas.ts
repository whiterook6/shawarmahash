const threeUppercaseLetters = {
  type: "string",
  minLength: 3,
  maxLength: 3,
  pattern: "^[A-Z]{3}$",
} as const;

export const schemas = {
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
            dataDirectory: {
              type: "object",
              properties: {
                exists: { type: "boolean" },
                readable: { type: "boolean" },
                writable: { type: "boolean" },
              },
              required: ["exists", "readable", "writable"],
              additionalProperties: false,
            },
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
            "dataDirectory",
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
              player: threeUppercaseLetters,
              score: { type: "number" },
            },
            required: ["player", "score"],
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
          player: threeUppercaseLetters,
        },
        required: ["player"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            player: threeUppercaseLetters,
            score: { type: "number" },
          },
          required: ["player", "score"],
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
              player: threeUppercaseLetters,
              score: { type: "number" },
            },
            required: ["player", "score"],
            additionalProperties: false,
          },
          additionalItems: false,
        },
      },
    },
  },
  getPlayerMessages: {
    schema: {
      Params: {
        type: "object",
        properties: {
          player: threeUppercaseLetters,
        },
        required: ["player"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              player: threeUppercaseLetters,
              team: threeUppercaseLetters,
              timestamp: { type: "number" },
              nonce: { type: "number" },
              hash: { type: "string" },
              previousHash: { type: "string" },
              message: { type: "string" },
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
              team: threeUppercaseLetters,
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
          team: threeUppercaseLetters,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            team: threeUppercaseLetters,
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
              team: threeUppercaseLetters,
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
  getTeamMessages: {
    schema: {
      Params: {
        type: "object",
        properties: {
          team: threeUppercaseLetters,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "number" },
              player: threeUppercaseLetters,
              team: threeUppercaseLetters,
              timestamp: { type: "number" },
              nonce: { type: "number" },
              hash: { type: "string" },
              previousHash: { type: "string" },
              message: { type: "string" },
            },
            required: [
              "index",
              "player",
              "team",
              "timestamp",
              "nonce",
              "hash",
              "previousHash",
              "message",
            ],
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
          team: threeUppercaseLetters,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: {
            ...threeUppercaseLetters,
          },
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
          team: threeUppercaseLetters,
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            previousHash: { type: "string" },
            previousTimestamp: { type: "number" },
            difficulty: { type: "string" },
          },
          required: ["previousHash", "previousTimestamp", "difficulty"],
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
          team: threeUppercaseLetters,
        },
        required: ["team"],
        additionalProperties: false,
      },
      Body: {
        type: "object",
        properties: {
          previousHash: { type: "string" },
          player: threeUppercaseLetters,
          nonce: { type: "number" },
          hash: { type: "string" },
          message: { type: "string" },
        },
        required: ["previousHash", "player", "nonce", "hash"],
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
                  player: threeUppercaseLetters,
                  team: threeUppercaseLetters,
                  timestamp: { type: "number" },
                  nonce: { type: "number" },
                  hash: { type: "string" },
                  previousHash: { type: "string" },
                  message: { type: "string" },
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
};
