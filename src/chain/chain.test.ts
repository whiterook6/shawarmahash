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
      hash: "fffff6057cdebbbdb6c9b714fc04521ddd77f21b2aa883df89df058aa3a4a015",
      previousHash:
        "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      player: "TIM",
      timestamp: 1767554271,
      nonce: 1658287,
      index: 0,
    };

    it("It returns a verification error if the genesis block has an incorrect index", () => {
      const genesisBlock = { ...validGenesisBlock, index: 1 };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe("Genesis block must have index 0");
    });

    it("It returns a verification error if the genesis block has an incorrect previousHash", () => {
      const genesisBlock = { ...validGenesisBlock, previousHash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae051" };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe(
        "Genesis block must have correct previousHash",
      );
    });

    it("It returns a verification error if the genesis block has an incorrect hash", () => {
      const genesisBlock = { ...validGenesisBlock, hash: "fffff9d16b97ae4ed83508e02ce0225cf098e07a745357fa397070cb61a389cd" };
      const verificationError = Chain.verifyGenesisBlock(genesisBlock);
      expect(verificationError).toBe("Genesis block must have correct hash");
    });

    it("it returns a verification error if the genesis block does not meet the difficulty requirement", () => {
      const genesisBlock: Block = {
        previousHash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        timestamp: 0,
        player: "TIM",
        nonce: 191,
        index: 0,
        hash: "ffb9af400b75871ac805543a0b5f09c198e865770b637daa8a4c4e097f2a908b"
      };
      const chain = [genesisBlock];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(`Genesis block does not meet difficulty requirement: ${genesisBlock.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`);
    });
  });

  describe("verifyChain", () => {
    const validChain = [
      {
        hash: "fffff6057cdebbbdb6c9b714fc04521ddd77f21b2aa883df89df058aa3a4a015",
        previousHash:
          "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        player: "TIM",
        timestamp: 1767554271,
        nonce: 1658287,
        index: 0,
      },
      {
        hash: "fffff8168c771242c496c6c76fe53c7c862631c9e86d7b54a4c57764b2409a16",
        previousHash:
          "fffff6057cdebbbdb6c9b714fc04521ddd77f21b2aa883df89df058aa3a4a015",
        player: "TIM",
        timestamp: 1767554274,
        nonce: 1814830,
        index: 1,
      },
      {
        hash: "fffff697c72271811dfce8c27d8e8fc191ac7c5da236faf79f8b592aebb9bc0d",
        previousHash:
          "fffff8168c771242c496c6c76fe53c7c862631c9e86d7b54a4c57764b2409a16",
        player: "TIM",
        timestamp: 1767554274,
        nonce: 80305,
        index: 2,
      },
      {
        hash: "fffff49e6b4a99b5d670b06ed15125a4d137a946ae51d5115017e0725234d63f",
        previousHash:
          "fffff697c72271811dfce8c27d8e8fc191ac7c5da236faf79f8b592aebb9bc0d",
        player: "TIM",
        timestamp: 1767554274,
        nonce: 416540,
        index: 3,
      },
      {
        hash: "fffffc8d820a3776f641514430c778ad20986033be683366b15c9aa414817020",
        previousHash:
          "fffff49e6b4a99b5d670b06ed15125a4d137a946ae51d5115017e0725234d63f",
        player: "TIM",
        timestamp: 1767554274,
        nonce: 88539,
        index: 4,
      },
      {
        hash: "fffff579ca4833042ef4a50d23100361472442aece3c48c276398f52ec5758d4",
        previousHash:
          "fffffc8d820a3776f641514430c778ad20986033be683366b15c9aa414817020",
        player: "TIM",
        timestamp: 1767554275,
        nonce: 519887,
        index: 5,
      },
      {
        hash: "fffff6c76c6ec1d3e46fd725cb559a0dab44377d00f819a9583c1abdbba1ea11",
        previousHash:
          "fffff579ca4833042ef4a50d23100361472442aece3c48c276398f52ec5758d4",
        player: "TIM",
        timestamp: 1767554275,
        nonce: 655080,
        index: 6,
      },
      {
        hash: "fffff9d16b97ae4ed83508e02ce0225cf098e07a745357fa397070cb61a389cd",
        previousHash:
          "fffff6c76c6ec1d3e46fd725cb559a0dab44377d00f819a9583c1abdbba1ea11",
        player: "TIM",
        timestamp: 1767554280,
        nonce: 4934882,
        index: 7,
      },
      {
        hash: "fffffd5a8646a86cc48cd8f87c11057d418dce8d4e51fea713740ae0b49636b5",
        previousHash:
          "fffff9d16b97ae4ed83508e02ce0225cf098e07a745357fa397070cb61a389cd",
        player: "TIM",
        timestamp: 1767554280,
        nonce: 648951,
        index: 8,
      },
      {
        hash: "fffffeabb12835297af258de66fa10ee64af6a3e0c631c4d44ee14c50bb03a3e",
        previousHash:
          "fffffd5a8646a86cc48cd8f87c11057d418dce8d4e51fea713740ae0b49636b5",
        player: "TIM",
        timestamp: 1767554280,
        nonce: 149543,
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
      chain[5].previousHash =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect previous hash: 0000000000000000000000000000000000000000000000000000000000000001 !== ${validChain[4].hash}`,
      );
    });

    it("It returns a verification error if one of the blocks has an incorrect hash", () => {
      const chain = validChain.map((block) => ({ ...block }));
      chain[5].hash =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect hash: 0000000000000000000000000000000000000000000000000000000000000001 !== ${validChain[5].hash}`,
      );
    });

    it("It returns a verification error if a block does not meet the difficulty requirement", () => {
      const block = {
        hash: "ffe63325e89c1e3e3dd6be60b6d5af12de8f737f445e7246e845f65099633d86",
        previousHash: "fffff49e6b4a99b5d670b06ed15125a4d137a946ae51d5115017e0725234d63f",
        player: "TIM",
        timestamp: 1767554274,
        nonce: 595,
        index: 4
      };

      const chain = validChain.map((block) => ({ ...block }));
      chain[4] = block;
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(`Block 4 does not meet difficulty requirement: ${block.hash} does not start with ${Difficulty.DEFAULT_DIFFICULTY_HASH}`);
    });
  });
});
