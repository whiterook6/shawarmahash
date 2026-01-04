export const schemas = {
  getPlayers: {
    schema: {
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              player: {
                type: "string",
                description: "The name of the player",
                pattern: "^[A-Z]{3}$",
              },
              score: {
                type: "number",
                description: "The player's score",
              },
            },
            required: ["player", "score"],
            additionalProperties: false,
          },
        },
      },
    },
  },
  getPlayerScore: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
        },
        required: ["player"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            player: {
              type: "string",
              description: "The name of the player",
              pattern: "^[A-Z]{3}$",
            },
            score: {
              type: "number",
              description: "The player's score",
            },
          },
          required: ["player", "score"],
          additionalProperties: false,
        },
      },
    },
  },
  getPlayerMessages: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
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
              player: { type: "string", pattern: "^[A-Z]{3}$" },
              team: { type: "string", pattern: "^[A-Z]{3}$" },
              timestamp: { type: "number" },
              nonce: { type: "number" },
              hash: { type: "string" },
              previousHash: { type: "string" },
              message: { type: "string" },
            },
            required: [
              "index",
              "player",
              "timestamp",
              "nonce",
              "hash",
              "previousHash",
            ],
            additionalProperties: false,
          },
        },
      },
    },
  },
  getPlayerChain: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
        },
        required: ["player"],
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
                  player: { type: "string", pattern: "^[A-Z]{3}$" },
                  team: { type: "string", pattern: "^[A-Z]{3}$" },
                  timestamp: { type: "number" },
                  nonce: { type: "number" },
                  hash: { type: "string" },
                  previousHash: { type: "string" },
                  message: { type: "string" },
                },
                required: [
                  "index",
                  "player",
                  "timestamp",
                  "nonce",
                  "hash",
                  "previousHash",
                ],
                additionalProperties: false,
              },
            },
            difficulty: {
              type: "string",
              description: "The difficulty target hash prefix",
            },
          },
          required: ["recent", "difficulty"],
          additionalProperties: false,
        },
      },
    },
  },
  getPlayerTeam: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
        },
        required: ["player"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            player: {
              type: "string",
              description: "The name of the player",
              pattern: "^[A-Z]{3}$",
            },
            team: {
              type: "string",
              description: "The player's team",
              pattern: "^[A-Z]{3}$",
            },
          },
          required: ["player"],
          additionalProperties: false,
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
              team: {
                type: "string",
                description: "The name of the team",
                pattern: "^[A-Z]{3}$",
              },
              score: {
                type: "number",
                description: "The team's score",
              },
            },
            required: ["team", "score"],
            additionalProperties: false,
          },
        },
      },
    },
  },
  getTeamScore: {
    schema: {
      params: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "The name of the team",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Team name must be 3 uppercase letters",
            },
          },
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            team: {
              type: "string",
              description: "The name of the team",
              pattern: "^[A-Z]{3}$",
            },
            score: {
              type: "number",
              description: "The team's score",
            },
          },
          required: ["team", "score"],
          additionalProperties: false,
        },
      },
    },
  },
  getTeamMessages: {
    schema: {
      params: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "The name of the team",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Team name must be 3 uppercase letters",
            },
          },
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
              player: { type: "string", pattern: "^[A-Z]{3}$" },
              team: { type: "string", pattern: "^[A-Z]{3}$" },
              timestamp: { type: "number" },
              nonce: { type: "number" },
              hash: { type: "string" },
              previousHash: { type: "string" },
              message: { type: "string" },
            },
            required: [
              "index",
              "player",
              "timestamp",
              "nonce",
              "hash",
              "previousHash",
            ],
            additionalProperties: false,
          },
        },
      },
    },
  },
  getTeamPlayers: {
    schema: {
      params: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "The name of the team",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Team name must be 3 uppercase letters",
            },
          },
        },
        required: ["team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "string",
            pattern: "^[A-Z]{3}$",
          },
        },
      },
    },
  },
  createPlayer: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
        },
        required: ["player"],
        additionalProperties: false,
      },
      body: {
        type: "object",
        properties: {
          hash: {
            type: "string",
            description: "The hash of the genesis block",
            pattern: "^[0-9a-f]{64}$",
            errorMessage: {
              pattern: "Hash must be a 64-character hexadecimal string",
            },
          },
          nonce: {
            type: "number",
            description: "The nonce used to generate the hash",
            minimum: 0,
          },
        },
        required: ["hash", "nonce"],
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
                  player: { type: "string", pattern: "^[A-Z]{3}$" },
                  team: { type: "string", pattern: "^[A-Z]{3}$" },
                  timestamp: { type: "number" },
                  nonce: { type: "number" },
                  hash: { type: "string" },
                  previousHash: { type: "string" },
                  message: { type: "string" },
                },
                required: [
                  "index",
                  "player",
                  "timestamp",
                  "nonce",
                  "hash",
                  "previousHash",
                ],
                additionalProperties: false,
              },
            },
            difficulty: {
              type: "string",
              description: "The difficulty target hash prefix",
            },
          },
          required: ["recent", "difficulty"],
          additionalProperties: false,
        },
      },
    },
  },
  submitBlock: {
    schema: {
      params: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            example: "ASD",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
        },
        required: ["player"],
        additionalProperties: false,
      },
      body: {
        type: "object",
        properties: {
          previousHash: {
            type: "string",
            description: "The hash of the previous block",
            pattern: "^[0-9a-f]{64}$",
            errorMessage: {
              pattern:
                "Previous hash must be a 64-character hexadecimal string",
            },
          },
          team: {
            type: "string",
            description: "The name of the team",
            pattern: "^[A-Z]{3}$",
            errorMessage: {
              pattern: "Team name must be 3 uppercase letters",
            },
          },
          nonce: {
            type: "number",
            description: "The nonce used to generate the hash",
            minimum: 0,
          },
          hash: {
            type: "string",
            description: "The hash of the block",
            pattern: "^[0-9a-f]{64}$",
            errorMessage: {
              pattern: "Hash must be a 64-character hexadecimal string",
            },
          },
          message: {
            type: "string",
            description: "An optional message associated with the block",
          },
        },
        required: ["previousHash", "team", "nonce", "hash"],
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
                  player: { type: "string", pattern: "^[A-Z]{3}$" },
                  team: { type: "string", pattern: "^[A-Z]{3}$" },
                  timestamp: { type: "number" },
                  nonce: { type: "number" },
                  hash: { type: "string" },
                  previousHash: { type: "string" },
                  message: { type: "string" },
                },
                required: [
                  "index",
                  "player",
                  "timestamp",
                  "nonce",
                  "hash",
                  "previousHash",
                ],
                additionalProperties: false,
              },
            },
            difficulty: {
              type: "string",
              description: "The difficulty target hash prefix",
            },
          },
          required: ["recent", "difficulty"],
          additionalProperties: false,
        },
      },
    },
  },
  testMint: {
    schema: {
      body: {
        type: "object",
        properties: {
          player: {
            type: "string",
            description: "The name of the player",
            pattern: "^[A-Z]{3}$",
            errorMessage: {
              pattern: "Player name must be 3 uppercase letters",
            },
          },
          team: {
            type: "string",
            description: "The name of the team",
            pattern: "^[A-Z]{3}$",
            errorMessage: {
              pattern: "Team name must be 3 uppercase letters",
            },
          },
          message: {
            type: "string",
            description: "An optional message associated with the block",
          },
        },
        required: ["player", "team"],
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            index: { type: "number" },
            player: { type: "string", pattern: "^[A-Z]{3}$" },
            team: { type: "string", pattern: "^[A-Z]{3}$" },
            timestamp: { type: "number" },
            nonce: { type: "number" },
            hash: { type: "string" },
            previousHash: { type: "string" },
            message: { type: "string" },
          },
          required: [
            "index",
            "player",
            "timestamp",
            "nonce",
            "hash",
            "previousHash",
          ],
          additionalProperties: false,
        },
      },
    },
  },
};
