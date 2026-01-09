import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Chain } from "./chain";
import expect from "expect";
import { Difficulty } from "../difficulty/difficulty";
import { Miner } from "../miner/miner";

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
      hash: "ffffff443df8467b46485551c714a9a8",
      previousHash: "ffffffffffffffffffffffffffffffff",
      player: "TIM",
      team: "VNC",
      timestamp: 1767896467,
      nonce: 693105,
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
      const { hash, nonce } = Miner.findHash({
        difficultyTarget: "ff000000000000000000000000000000",
        previousHash: "ffffffffffffffffffffffffffffffff",
        previousTimestamp: 0,
        player: "TIM",
        team: "VNC",
      });
      const easyGenesisBlock: Block = {
        previousHash: "ffffffffffffffffffffffffffffffff",
        timestamp: 0,
        player: "TIM",
        team: "VNC",
        nonce,
        index: 0,
        hash,
      };

      const chain = [easyGenesisBlock];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Genesis block does not meet difficulty requirement: ${hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`,
      );
    });
  });

  describe("verifyChain", () => {
    const validChain = [
      {
        hash: "ffffff443df8467b46485551c714a9a8",
        previousHash: "ffffffffffffffffffffffffffffffff",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896467,
        nonce: 693105,
        index: 0,
      },
      {
        hash: "fffffe8520c6ed793c74512ab1510bb9",
        previousHash: "ffffff443df8467b46485551c714a9a8",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896467,
        nonce: 73031,
        index: 1,
      },
      {
        hash: "fffff7dea3b59e78c83949b73c33efca",
        previousHash: "fffffe8520c6ed793c74512ab1510bb9",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896468,
        nonce: 1214541,
        index: 2,
      },
      {
        hash: "fffffe10c03a11b234b2618a9dfb789d",
        previousHash: "fffff7dea3b59e78c83949b73c33efca",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896469,
        nonce: 1037970,
        index: 3,
      },
      {
        hash: "fffff1164d054848aeb6b92e27ba0422",
        previousHash: "fffffe10c03a11b234b2618a9dfb789d",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896470,
        nonce: 355083,
        index: 4,
      },
      {
        hash: "fffff5fb19174607834e26425baebe80",
        previousHash: "fffff1164d054848aeb6b92e27ba0422",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896470,
        nonce: 285686,
        index: 5,
      },
      {
        hash: "fffff0a565e0cee2e197cda11f6455f2",
        previousHash: "fffff5fb19174607834e26425baebe80",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896470,
        nonce: 280008,
        index: 6,
      },
      {
        hash: "fffffbd87ab840ac03ac86075c75334b",
        previousHash: "fffff0a565e0cee2e197cda11f6455f2",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896472,
        nonce: 2241809,
        index: 7,
      },
      {
        hash: "fffff8cef8af439768ebd6fdda222c3f",
        previousHash: "fffffbd87ab840ac03ac86075c75334b",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896474,
        nonce: 2270105,
        index: 8,
      },
      {
        hash: "fffff88e2c52890d1ec746f603c90e9c",
        previousHash: "fffff8cef8af439768ebd6fdda222c3f",
        player: "TIM",
        team: "VNC",
        timestamp: 1767896474,
        nonce: 404051,
        index: 9,
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
      const block = { ...validChain[4] };
      const { hash, nonce } = Miner.findHash({
        difficultyTarget: "ff000000000000000000000000000000",
        previousHash: block.previousHash,
        previousTimestamp: validChain[3].timestamp,
        player: block.player,
        team: block.team,
      });
      block.hash = hash;
      block.nonce = nonce;

      const chain = validChain.slice(0, 4).map((block) => ({ ...block }));
      chain.push(block);
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 4 does not meet difficulty requirement: ${block.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`,
      );
    });
  });
});
