export const schemas = {
  getPlayers: {
    schema: {
      params: {
        type: "object",
        required: ["player"],
        properties: {
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
    },
  },
  getTeams: {
    schema: {
      params: {
        type: "object",
        required: ["team"],
        properties: {
          team: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
    },
  },
  getPlayerChat: {
    schema: {
      params: {
        type: "object",
        required: ["player"],
        properties: {
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
    },
  },
  getTeamChat: {
    schema: {
      params: {
        type: "object",
        required: ["team"],
        properties: {
          team: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
    },
  },
  submitBlock: {
    schema: {
      body: {
        type: "object",
        required: ["previousHash", "player", "nonce", "hash"],
        properties: {
          previousHash: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
          team: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Optional three uppercase letters (AAA-ZZZ)",
          },
          nonce: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          hash: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          message: {
            type: "string",
            maxLength: 256,
            description: "Optional message (max 256 characters)",
          },
        },
      },
    },
  },
  mineBlock: {
    schema: {
      body: {
        type: "object",
        required: ["player"],
        properties: {
          team: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Optional three uppercase letters (AAA-ZZZ)",
          },
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
          message: {
            type: "string",
            maxLength: 256,
            description: "Optional message (max 256 characters)",
          },
        },
      },
    },
  },
  createPlayer: {
    schema: {
      params: {
        type: "object",
        required: ["player"],
        properties: {
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
    },
  },
  postPlayer: {
    schema: {
      params: {
        type: "object",
        required: ["player"],
        properties: {
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Three uppercase letters (AAA-ZZZ)",
          },
        },
      },
      body: {
        type: "object",
        required: [],
        properties: {
          previousHash: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          player: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description:
              "Three uppercase letters (AAA-ZZZ) - optional, uses param if not provided",
          },
          team: {
            type: "string",
            pattern: "^[A-Z]{3}$",
            description: "Optional three uppercase letters (AAA-ZZZ)",
          },
          nonce: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          hash: {
            type: "string",
            pattern: "^[0-9a-fA-F]+$",
            description: "Base-16 (hexadecimal) string",
          },
          message: {
            type: "string",
            maxLength: 256,
            description: "Optional message (max 256 characters)",
          },
        },
      },
    },
  },
};
