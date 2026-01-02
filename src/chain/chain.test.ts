import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Chain } from "./chain";
import expect from "expect";

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

  describe("verifyChain", () => {
    const validChain = [
      {
        hash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae050",
        previousHash:
          "0000000000000000000000000000000000000000000000000000000000000000",
        player: "TIM",
        timestamp: 1767381331,
        nonce: 80555,
        index: 0,
      },
      {
        hash: "00000afbdff0754f7a3b8ce9c0e3479d7086001b315a2807157e29bc96eb86e8",
        previousHash:
          "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae050",
        player: "TIM",
        timestamp: 1767381332,
        nonce: 992347,
        index: 1,
      },
      {
        hash: "000003cd4afff6faa5dee3d2c1fad67b6286a4eac9c4d66f03e02e5967b316da",
        previousHash:
          "00000afbdff0754f7a3b8ce9c0e3479d7086001b315a2807157e29bc96eb86e8",
        player: "TIM",
        timestamp: 1767381333,
        nonce: 829449,
        index: 2,
      },
      {
        hash: "000000fa66fae8b055b32c3dec542d48bf696601dd5e4400ddeac27b86977e30",
        previousHash:
          "000003cd4afff6faa5dee3d2c1fad67b6286a4eac9c4d66f03e02e5967b316da",
        player: "TIM",
        timestamp: 1767381334,
        nonce: 769620,
        index: 3,
      },
      {
        hash: "00000b5e80a58d4dff837101b141eb2af4ba9d3d92ce6e957f6f5b1a1bc5b5c0",
        previousHash:
          "000000fa66fae8b055b32c3dec542d48bf696601dd5e4400ddeac27b86977e30",
        player: "TIM",
        timestamp: 1767381335,
        nonce: 1148930,
        index: 4,
      },
      {
        hash: "00000030bf1e86e01952fa40d9b80759eed3232f35e743952678f0f997a627d5",
        previousHash:
          "00000b5e80a58d4dff837101b141eb2af4ba9d3d92ce6e957f6f5b1a1bc5b5c0",
        player: "TIM",
        timestamp: 1767381335,
        nonce: 1006137,
        index: 5,
      },
      {
        hash: "000002f4cb68ff82c5e1a3e63903d6018905cea137bf5a45455fb3395077edbb",
        previousHash:
          "00000030bf1e86e01952fa40d9b80759eed3232f35e743952678f0f997a627d5",
        player: "TIM",
        timestamp: 1767381336,
        nonce: 662000,
        index: 6,
      },
      {
        hash: "00000b205c2dfc3ae2b4ddfd80d8e06c3ddc6b2a7346812b6bd693c989862fbe",
        previousHash:
          "000002f4cb68ff82c5e1a3e63903d6018905cea137bf5a45455fb3395077edbb",
        player: "TIM",
        timestamp: 1767381336,
        nonce: 97810,
        index: 7,
      },
      {
        hash: "00000164fce67ad6b81718943f17c5ebdf214f9cc8c927220fa45426948b76bd",
        previousHash:
          "00000b205c2dfc3ae2b4ddfd80d8e06c3ddc6b2a7346812b6bd693c989862fbe",
        player: "TIM",
        timestamp: 1767381337,
        nonce: 852429,
        index: 8,
      },
      {
        hash: "000007c4a9be2e3f25d0c09e9fed1fd0cce883d0ce610b47cc06e56cd14f572a",
        previousHash:
          "00000164fce67ad6b81718943f17c5ebdf214f9cc8c927220fa45426948b76bd",
        player: "TIM",
        timestamp: 1767381337,
        nonce: 820168,
        index: 9,
      },
    ];

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

    it("It returns a verification error if the genesis block has an incorrect index", () => {
      const chain = [
        {
          hash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae050",
          previousHash:
            "0000000000000000000000000000000000000000000000000000000000000000",
          timestamp: 1767380413,
          nonce: 80555,
          index: 1,
          player: "TIM",
          message: "Are you ready for a story?",
        },
      ];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe("Genesis block must have index 0");
    });

    it("It returns a verification error if the genesis block has an incorrect previousHash", () => {
      const chain = [
        {
          hash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae050",
          previousHash:
            "0000000000000000000000000000000000000000000000000000000000000001",
          timestamp: 1767380413,
          nonce: 80555,
          index: 0,
          player: "TIM",
          message: "Are you ready for a story?",
        },
      ];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        "Genesis block must have correct previousHash",
      );
    });

    it("It returns a verification error if the genesis block has an incorrect hash", () => {
      const chain = [
        {
          hash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae051",
          previousHash:
            "0000000000000000000000000000000000000000000000000000000000000000",
          timestamp: 1767380413,
          nonce: 80555,
          index: 0,
          player: "TIM",
          message: "Are you ready for a story?",
        },
      ];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe("Genesis block must have correct hash");
    });

    it("It returns a verification error if the block has an incorrect index", () => {
      const chain = [
        {
          hash: "000006b6f3920d11d28c05f5f17ab79d45dc88ceef8c05b5a841405e731ae050",
          previousHash:
            "0000000000000000000000000000000000000000000000000000000000000000",
          timestamp: 1767380413,
          nonce: 80555,
          index: 1,
          player: "TIM",
          message: "Are you ready for a story?",
        },
      ];
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe("Genesis block must have index 0");
    });

    it("It returns a verification error if one of the blocks has an incorrect previous hash", () => {
      const chain = [
        ...validChain.map((block) => {
          return {
            ...block,
          };
        }),
      ];
      chain[5].previousHash =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect previous hash: 0000000000000000000000000000000000000000000000000000000000000001 !== ${validChain[4].hash}`,
      );
    });

    it("It returns a verification error if one of the blocks has an incorrect hash", () => {
      const chain = [
        ...validChain.map((block) => {
          return {
            ...block,
          };
        }),
      ];
      chain[5].hash =
        "0000000000000000000000000000000000000000000000000000000000000001";
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(
        `Block 5 has incorrect hash: 0000000000000000000000000000000000000000000000000000000000000001 !== ${validChain[5].hash}`,
      );
    });

    it("It returns a verification error if one of the blocks has an incorrect index", () => {
      const chain = [
        ...validChain.map((block) => {
          return {
            ...block,
          };
        }),
      ];
      chain[5].index = 10;
      const verificationError = Chain.verifyChain(chain);
      expect(verificationError).toBe(`Block 5 has incorrect index: 10`);
    });
  });
});
