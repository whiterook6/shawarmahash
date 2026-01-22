import { faker } from "@faker-js/faker/.";
import { Block } from "./block";

export const BlockFaker = {
  one: (overrides: Partial<Block> = {}): Block => {
    return {
      index: 0,
      player: faker.string.alpha(3).toUpperCase(),
      timestamp: faker.date.past().getTime() / 1000,
      nonce: faker.number.int({ min: 0, max: 1000000 }),
      hash: faker.string.hexadecimal({ length: 32 }),
      previousHash: faker.string.hexadecimal({ length: 32 }),
      team: faker.string.alpha(3).toUpperCase(),
      identity: faker.string.hexadecimal({ length: 16 }),
      message: faker.lorem.sentence(),
      ...overrides,
    };
  },
  many: (
    count: number,
    overrides: (index: number) => Partial<Block> = () => ({}),
  ): Block[] => {
    return Array.from({ length: count }, (_, index) =>
      BlockFaker.one(overrides(index)),
    );
  },
};
