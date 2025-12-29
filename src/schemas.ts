export const schemas = {
  playerParamsSchema: {
    type: "object",
    required: ["player"],
    properties: {
      player: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      }
    }
  },
  teamParamsSchema: {
    type: "object",
    required: ["team"],
    properties: {
      team: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      }
    }
  },
  submitBodySchema: {
    type: "object",
    required: ["previousHash", "player", "team", "nonce", "hash"],
    properties: {
      previousHash: {
        type: "string",
        pattern: "^[0-9a-fA-F]+$",
        description: "Base-16 (hexadecimal) string"
      },
      player: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      },
      team: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      },
      nonce: {
        type: "string",
        pattern: "^[0-9a-fA-F]+$",
        description: "Base-16 (hexadecimal) string"
      },
      hash: {
        type: "string",
        pattern: "^[0-9a-fA-F]+$",
        description: "Base-16 (hexadecimal) string"
      },
      message: {
        type: "string",
        maxLength: 256,
        description: "Optional message (max 256 characters)"
      }
    }
  },
  testMineBodySchema: {
    type: "object",
    required: ["team", "player"],
    properties: {
      team: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      },
      player: {
        type: "string",
        pattern: "^[A-Z]{3}$",
        description: "Three uppercase letters (AAA-ZZZ)"
      },
      message: {
        type: "string",
        maxLength: 256,
        description: "Optional message (max 256 characters)"
      }
    }
  },
  chatPlayerMessagesSchema: {
    params: {
      type: "object",
      required: ["player"],
      properties: {
        player: {
          type: "string",
          pattern: "^[A-Z]{3}$",
          description: "Three uppercase letters (AAA-ZZZ)"
        }
      }
    }
  },
  chatTeamMessagesSchema: {
    params: {
      type: "object",
      required: ["team"],
      properties: {
        team: {
          type: "string",
          pattern: "^[A-Z]{3}$",
          description: "Three uppercase letters (AAA-ZZZ)"
        }
      }
    }
  }
};