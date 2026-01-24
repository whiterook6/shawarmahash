import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Chain } from "./chain";
import expect from "expect";
import { Difficulty } from "../difficulty/difficulty";
import { Miner } from "../miner/miner";
import { BlockFaker } from "../block/block.faker";

describe("Chain", () => {
  const validChain = [
    {
      hash: "fffffba761b392d4d82fd2e5dc5ecc45",
      previousHash: "ffffffffffffffffffffffffffffffff",
      player: "TIM",
      team: "TST",
      timestamp: 1768790923,
      nonce: 350800,
      index: 0,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff9f144dbe048ab0c2009592f472b",
      previousHash: "fffffba761b392d4d82fd2e5dc5ecc45",
      player: "TIM",
      team: "TST",
      timestamp: 1768790923,
      nonce: 178143,
      index: 1,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff8dacdd19387e13aa800e24ded84",
      previousHash: "fffff9f144dbe048ab0c2009592f472b",
      player: "TIM",
      team: "TST",
      timestamp: 1768790924,
      nonce: 932808,
      index: 2,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffffe892c7ab1a894578e502be6a804",
      previousHash: "fffff8dacdd19387e13aa800e24ded84",
      player: "TIM",
      team: "TST",
      timestamp: 1768790924,
      nonce: 86437,
      index: 3,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffffd908585329758a160fffe3b25ef",
      previousHash: "fffffe892c7ab1a894578e502be6a804",
      player: "TIM",
      team: "TST",
      timestamp: 1768790924,
      nonce: 292026,
      index: 4,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff45b65cc069c36d2400bc13ce838",
      previousHash: "fffffd908585329758a160fffe3b25ef",
      player: "TIM",
      team: "TST",
      timestamp: 1768790925,
      nonce: 896847,
      index: 5,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff43cdfc53056860aec1394e8dcf6",
      previousHash: "fffff45b65cc069c36d2400bc13ce838",
      player: "TIM",
      team: "TST",
      timestamp: 1768790926,
      nonce: 323313,
      index: 6,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffffa9c2d2d847e0fb9127b2bade290",
      previousHash: "fffff43cdfc53056860aec1394e8dcf6",
      player: "TIM",
      team: "TST",
      timestamp: 1768790926,
      nonce: 46329,
      index: 7,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff25e3180f850a0841153264a2535",
      previousHash: "fffffa9c2d2d847e0fb9127b2bade290",
      player: "TIM",
      team: "TST",
      timestamp: 1768790927,
      nonce: 1525543,
      index: 8,
      identity: "b989bcb4a39c769d",
    },
    {
      hash: "fffff82d71d99f0ed11264b1c4af41be",
      previousHash: "fffff25e3180f850a0841153264a2535",
      player: "TIM",
      team: "TST",
      timestamp: 1768790928,
      nonce: 1754841,
      index: 9,
      identity: "b989bcb4a39c769d",
    },
  ];

  describe("getAverageMiningInterval", () => {
    it("It can get the average mining interval", () => {
      const chain = BlockFaker.many(100);
      chain[0].timestamp = 1767315426;
      chain[99].timestamp = 1767315452;

      const averageMiningInterval = Chain.getAverageMiningInterval(chain);
      expect(averageMiningInterval).toBe(0.26);
    });

    it("It can get the interval for a single block", () => {
      const chain = [BlockFaker.one()];
      const interval = Chain.getAverageMiningInterval(chain);
      expect(interval).toBe(0);
    });

    it("The interval for a chain with a negative interval is not zero", () => {
      const chain = BlockFaker.many(10);
      chain[0].timestamp = 1767315452;
      chain[9].timestamp = 767315426;
      const interval = Chain.getAverageMiningInterval(chain);
      expect(interval).toBeGreaterThan(0);
      expect(interval).toBeLessThan(1);
    });
  });

  describe("verifyGenesisBlock", () => {
    const validGenesisBlock: Block = {
      hash: "ffffffe2a6155f0b1fe81c9c9e4491a2",
      previousHash: "ffffffffffffffffffffffffffffffff",
      player: "TIM",
      team: "TST",
      timestamp: 1768785409,
      nonce: 930379,
      index: 0,
      identity: "727f8fc5f18ce498",
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
        team: "TST",
      });
      const easyGenesisBlock: Block = {
        previousHash: "ffffffffffffffffffffffffffffffff",
        timestamp: 0,
        player: "TIM",
        team: "TST",
        identity: "727f8fc5f18ce498",
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

  describe("getPlayerBlocks", () => {
    it("It can get the blocks for a player", () => {
      const chain = validChain.map((block) => ({ ...block }));
      chain[1].identity = "abcdef9bcb4a39c7";
      chain[6].identity = "abcdef9bcb4a39c7";
      const playerBlocks = Chain.getPlayerBlocks(chain, "abcdef9bcb4a39c7");
      expect(playerBlocks).toEqual([
        expect.objectContaining({
          player: "TIM",
          identity: "abcdef9bcb4a39c7",
        }),
        expect.objectContaining({
          player: "TIM",
          identity: "abcdef9bcb4a39c7",
        }),
      ]);
    });

    it("It returns an empty array if the player is not found", () => {
      const chain = validChain;
      const playerBlocks = Chain.getPlayerBlocks(chain, "0000000000000000");
      expect(playerBlocks).toEqual([]);
    });
  });
});
