import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Chain } from "./chain";
import expect from "expect";
import { Difficulty } from "../difficulty/difficulty";

describe("Chain", () => {
  describe("getAverageMiningInterval", () => {
    it("It can get the average mining interval", () => {
      const chain = Block.Faker.many(100);
      chain[0].timestamp = 1767315426;
      chain[99].timestamp = 1767315452;

      const averageMiningInterval = Chain.getAverageMiningInterval(chain);
      expect(averageMiningInterval).toBe(0.26);
    });

    it("It can get the interval for a single block", () => {
      const chain = [Block.Faker.one()];
      const interval = Chain.getAverageMiningInterval(chain);
      expect(interval).toBe(0);
    });

    it("The interval for a chain with a negative interval is zero", () => {
      const chain = Block.Faker.many(10);
      chain[0].timestamp = 1767315452;
      chain[9].timestamp = 767315426;
      const interval = Chain.getAverageMiningInterval(chain);
      expect(interval).toBe(0);
    });
  });

  describe("verifyGenesisBlock", () => {
    const validGenesisBlock: Block = {
      hash: "fffffdbf53e2c47ca9d00e4603facdbd",
      previousHash: "ffffffffffffffffffffffffffffffff",
      player: "MIT",
      timestamp: 1767569774,
      nonce: 1065274,
      index: 0,
    };

    it("It returns a verification error if the genesis block has an incorrect index", () => {
      const genesisBlock = { ...validGenesisBlock, index: 1 };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe("Genesis block must have index 0");
    });

    it("It returns a verification error if the genesis block has an incorrect previousHash", () => {
      const genesisBlock = {
        ...validGenesisBlock,
        previousHash: "000006b6f3920d11d28c05f5f17ab79d",
      };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe(
        "Genesis block must have correct previousHash",
      );
    });

    it("It returns a verification error if the genesis block has an incorrect hash", () => {
      const genesisBlock = {
        ...validGenesisBlock,
        hash: "fffffdbf53e2c47ca9d00e4603facdbe", // last e instead of d
      };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe("Genesis block must have correct hash");
    });

    it("it returns a verification error if the genesis block does not meet the difficulty requirement", () => {
      const genesisBlock: Block = {
        previousHash: "ffffffffffffffffffffffffffffffff",
        timestamp: 0,
        player: "TIM",
        nonce: 14,
        index: 0,
        hash: "ffa0670707e9bcedaf9b2a4089f79df5",
      };

      const chain = [genesisBlock];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Genesis block does not meet difficulty requirement: ${genesisBlock.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`,
      );
    });
  });

  describe("verifyChain", () => {
    const validChain = [
      {
        hash: "fffffdbf53e2c47ca9d00e4603facdbd",
        previousHash: "ffffffffffffffffffffffffffffffff",
        player: "MIT",
        timestamp: 1767569774,
        nonce: 1065274,
        index: 0,
      },
      {
        hash: "fffffcc784b6d995a1c0394312f1e701",
        previousHash: "fffffdbf53e2c47ca9d00e4603facdbd",
        player: "MIT",
        timestamp: 1767569775,
        nonce: 610524,
        index: 1,
        team: "TIM",
      },
      {
        hash: "fffffc3ecda1024865bf96c226eecd70",
        previousHash: "fffffcc784b6d995a1c0394312f1e701",
        player: "MIT",
        timestamp: 1767569775,
        nonce: 375830,
        index: 2,
        team: "TIM",
      },
      {
        hash: "fffff0c90938e64739fe3aa964dfe887",
        previousHash: "fffffc3ecda1024865bf96c226eecd70",
        player: "MIT",
        timestamp: 1767569779,
        nonce: 4152779,
        index: 3,
        team: "TIM",
      },
      {
        hash: "fffff3bbda1760827f461c9b3eb39945",
        previousHash: "fffff0c90938e64739fe3aa964dfe887",
        player: "MIT",
        timestamp: 1767569780,
        nonce: 950213,
        index: 4,
        team: "TIM",
      },
      {
        hash: "fffff86ec084f21ee3cc501d51068a39",
        previousHash: "fffff3bbda1760827f461c9b3eb39945",
        player: "MIT",
        timestamp: 1767569780,
        nonce: 48536,
        index: 5,
        team: "TIM",
      },
      {
        hash: "fffffea261ccda7947c2a1ea034ce6b8",
        previousHash: "fffff86ec084f21ee3cc501d51068a39",
        player: "MIT",
        timestamp: 1767569780,
        nonce: 29449,
        index: 6,
        team: "TIM",
      },
      {
        hash: "fffff574d7ab5d00c98d76f2fb496be1",
        previousHash: "fffffea261ccda7947c2a1ea034ce6b8",
        player: "MIT",
        timestamp: 1767569780,
        nonce: 1057864,
        index: 7,
        team: "TIM",
      },
      {
        hash: "fffffcf3cfb70ff519768e1a713a6e87",
        previousHash: "fffff574d7ab5d00c98d76f2fb496be1",
        player: "MIT",
        timestamp: 1767569781,
        nonce: 1156596,
        index: 8,
        team: "TIM",
      },
      {
        hash: "fffff374897ef8847073ced021f52a67",
        previousHash: "fffffcf3cfb70ff519768e1a713a6e87",
        player: "MIT",
        timestamp: 1767569782,
        nonce: 381243,
        index: 9,
        team: "TIM",
      },
    ];

    it("A empty chain is invalid", () => {
      const verificationError = Chain.verifyChain([]);
      expect(verificationError).toBe("Empty chain is invalid");
    });

    it("can verify a chain with just a genesis block", () => {
      const chain = [validChain[0]];
      const result = Chain.verifyChain(chain);
      expect(result).toBeUndefined();
    });

    it("It can verify a chain with multiple blocks", () => {
      const chain = validChain;
      const result = Chain.verifyChain(chain);
      expect(result).toBeUndefined();
    });

    it("It returns a verification error if the chain is empty", () => {
      const verificationError = Chain.verifyChain([]);
      expect(verificationError).toBe("Empty chain is invalid");
    });

    it("It returns a verification error if one of the blocks has an incorrect index", () => {
      const chain = validChain.map((block) => ({ ...block }));
      chain[3].index = 5;
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe("Block 3 has incorrect index: 5");
    });

    it("It returns a verification error if one of the blocks has an incorrect previous hash", () => {
      const chain = validChain.map((block) => ({ ...block }));
      chain[5].previousHash = "00000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect previous hash: 00000000000000000000000000000001 !== ${validChain[4].hash}`,
      );
    });

    it("It returns a verification error if one of the blocks has an incorrect hash", () => {
      const chain = validChain.map((block) => ({ ...block }));
      chain[5].hash = "00000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect hash: 00000000000000000000000000000001 !== ${validChain[5].hash}`,
      );
    });

    it("It returns a verification error if a block does not meet the difficulty requirement", () => {
      const block = {
        index: 4,
        hash: "ffeebc32413768b27ddedf457a1d4717", // difficulty too low
        previousHash: "fffff0c90938e64739fe3aa964dfe887",
        player: "MIT",
        timestamp: 1767570822,
        nonce: 86,
        team: "TIM",
      };

      const chain = validChain.slice(0, 4).map((block) => ({ ...block }));
      chain.push(block);
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 4 does not meet difficulty requirement: ${block.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`,
      );
    });
  });
});
