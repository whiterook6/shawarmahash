import expect from "expect";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Block } from "../block/block";
import { Data } from "./data";

describe("Data", () => {
  describe("stringify", () => {
    it("Can stringify a block with leading Fs in hash and previousHash", () => {
      const block: Block = {
        hash: "ffffb13b9e5e847936705e86dd4b7799",
        previousHash: "ffffedb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
      };

      const result = Data.stringify(block);
      // Leading Fs should be removed
      expect(result).toBe(
        "b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648",
      );
    });

    it("Can stringify a block without leading Fs", () => {
      const block: Block = {
        hash: "b13b9e5e847936705e86dd4b7799",
        previousHash: "edb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
      };

      const result = Data.stringify(block);
      expect(result).toBe(
        "b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648",
      );
    });

    it("Can stringify a block with all Fs in hash", () => {
      const block: Block = {
        hash: "ffffffffffffffffffffffffffffffff",
        previousHash: "ffffffffffffffffffffffffffffffff",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
      };

      const result = Data.stringify(block);
      // All Fs should be removed, leaving empty strings
      expect(result).toBe("::TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648");
    });
  });

  describe("parse", () => {
    it("Can parse a line with leading Fs removed from hash and previousHash", () => {
      const line =
        "b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648";

      const result = Data.parse(line);
      expect(result).toEqual({
        hash: "ffffb13b9e5e847936705e86dd4b7799",
        previousHash: "ffffedb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
        data: {},
      });
    });

    it("Can parse a line with empty hash and previousHash (all Fs)", () => {
      const line = "::TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648";

      const result = Data.parse(line);
      expect(result).toEqual({
        hash: "ffffffffffffffffffffffffffffffff",
        previousHash: "ffffffffffffffffffffffffffffffff",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
        data: {},
      });
    });

    it("Can parse all provided test blocks", () => {
      const testBlocks: Block[] = [
        {
          hash: "ffffb13b9e5e847936705e86dd4b7799",
          previousHash: "ffffedb8c1afbf45558223119f87365a",
          player: "TIM",
          team: "TST",
          timestamp: 1769230455,
          nonce: 267150,
          index: 6648,
          identity: "f77ad768fd3d3f64",
        },
        {
          hash: "ffff8835ebb34b92c9e5c61e475fbdf1",
          previousHash: "ffffb13b9e5e847936705e86dd4b7799",
          player: "TIM",
          team: "TST",
          timestamp: 1769230456,
          nonce: 821623,
          index: 6649,
          identity: "f77ad768fd3d3f64",
        },
        {
          hash: "fffffa996268f1c44c34bad759bbdbea",
          previousHash: "ffff8835ebb34b92c9e5c61e475fbdf1",
          player: "TIM",
          team: "TST",
          timestamp: 1769230458,
          nonce: 529162,
          index: 6650,
          identity: "f77ad768fd3d3f64",
        },
        {
          hash: "ffffbeff2df453970270bcc588b58617",
          previousHash: "fffffa996268f1c44c34bad759bbdbea",
          player: "TIM",
          team: "TST",
          timestamp: 1769230459,
          nonce: 571987,
          index: 6651,
          identity: "f77ad768fd3d3f64",
        },
        {
          hash: "ffff94bbc38aed73a3bff83ff9d44abb",
          previousHash: "ffffbeff2df453970270bcc588b58617",
          player: "TIM",
          team: "TST",
          timestamp: 1769230459,
          nonce: 702806,
          index: 6652,
          identity: "f77ad768fd3d3f64",
        },
      ];

      for (const block of testBlocks) {
        const stringified = Data.stringify(block);
        const parsed = Data.parse(stringified);
        // When parsing blocks without data, data should be set to {}
        expect(parsed).toEqual({ ...block, data: {} });
      }
    });

    it("Throws error for invalid format (wrong number of parts)", () => {
      const line = "hash:previousHash:player:team:timestamp:nonce:identity";

      expect(() => Data.parse(line)).toThrow(
        "Invalid block format: expected 8 parts separated by ':', got 7",
      );
    });

    it("Can parse a line with data (9 parts)", () => {
      const line =
        'b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648:{"hello":"world","count":42}';

      const result = Data.parse(line);
      expect(result).toEqual({
        hash: "ffffb13b9e5e847936705e86dd4b7799",
        previousHash: "ffffedb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
        data: { hello: "world", count: 42 },
      });
    });

    it("Can stringify and parse a block with data", () => {
      const block: Block = {
        hash: "ffffb13b9e5e847936705e86dd4b7799",
        previousHash: "ffffedb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
        data: { hello: "world", count: 42 },
      };

      const stringified = Data.stringify(block);
      expect(stringified).toBe(
        'b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648:{"hello":"world","count":42}',
      );

      const parsed = Data.parse(stringified);
      expect(parsed).toEqual(block);
    });

    it("Does not include data separator when data is empty object", () => {
      const block: Block = {
        hash: "ffffb13b9e5e847936705e86dd4b7799",
        previousHash: "ffffedb8c1afbf45558223119f87365a",
        player: "TIM",
        team: "TST",
        timestamp: 1769230455,
        nonce: 267150,
        index: 6648,
        identity: "f77ad768fd3d3f64",
        data: {},
      };

      const stringified = Data.stringify(block);
      // Should not include the 9th part when data is empty
      expect(stringified).toBe(
        "b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648",
      );

      const parsed = Data.parse(stringified);
      // Should return empty object when parsing 8 parts
      expect(parsed.data).toEqual({});
    });

    it("Throws error for invalid JSON in data part", () => {
      const line =
        "b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648:invalid-json";

      expect(() => Data.parse(line)).toThrow(
        "Invalid block format: data part is not valid JSON",
      );
    });

    it.only("Throws error when data part is not an object", () => {
      const line =
        'b13b9e5e847936705e86dd4b7799:edb8c1afbf45558223119f87365a:TIM:TST:1769230455:4138e:f77ad768fd3d3f64:6648:["array","not","object"]';

      expect(() => Data.parse(line)).toThrow(
        "Invalid block format: data part is not valid JSON",
      );
    });

    it("Throws error for invalid numeric values", () => {
      const line = "hash:previousHash:player:team:invalid:nonce:identity:index";

      expect(() => Data.parse(line)).toThrow(
        "Invalid block format: timestamp, nonce, or index is not a valid number",
      );
    });
  });

  describe("stringify and parse roundtrip", () => {
    it("Can roundtrip blocks through stringify and parse", async () => {
      const tempDir = await mkdtemp(join(tmpdir(), "shawarmahash-test-"));
      const dataDir = join(tempDir, "data");
      await mkdir(dataDir, { recursive: true });

      try {
        const data = new Data(dataDir);
        const testBlocks: Block[] = [
          {
            hash: "ffffb13b9e5e847936705e86dd4b7799",
            previousHash: "ffffedb8c1afbf45558223119f87365a",
            player: "TIM",
            team: "TST",
            timestamp: 1769230455,
            nonce: 267150,
            index: 6648,
            identity: "f77ad768fd3d3f64",
          },
          {
            hash: "ffff8835ebb34b92c9e5c61e475fbdf1",
            previousHash: "ffffb13b9e5e847936705e86dd4b7799",
            player: "TIM",
            team: "TST",
            timestamp: 1769230456,
            nonce: 821623,
            index: 6649,
            identity: "f77ad768fd3d3f64",
          },
          {
            hash: "fffffa996268f1c44c34bad759bbdbea",
            previousHash: "ffff8835ebb34b92c9e5c61e475fbdf1",
            player: "TIM",
            team: "TST",
            timestamp: 1769230458,
            nonce: 529162,
            index: 6650,
            identity: "f77ad768fd3d3f64",
          },
          {
            hash: "ffffbeff2df453970270bcc588b58617",
            previousHash: "fffffa996268f1c44c34bad759bbdbea",
            player: "TIM",
            team: "TST",
            timestamp: 1769230459,
            nonce: 571987,
            index: 6651,
            identity: "f77ad768fd3d3f64",
          },
          {
            hash: "ffff94bbc38aed73a3bff83ff9d44abb",
            previousHash: "ffffbeff2df453970270bcc588b58617",
            player: "TIM",
            team: "TST",
            timestamp: 1769230459,
            nonce: 702806,
            index: 6652,
            identity: "f77ad768fd3d3f64",
          },
        ];

        // Test appendBlocks and loadChain integration
        await data.createChainFile("TST");
        await data.appendBlocks("TST", testBlocks);
        const loadedChain = await data.loadChain("TST");

        expect(loadedChain).toHaveLength(5);
        for (let i = 0; i < testBlocks.length; i++) {
          // When parsing blocks without data, data should be set to {}
          expect(loadedChain[i]).toEqual({ ...testBlocks[i], data: {} });
        }

        // Verify file content format
        const fileContent = await readFile(join(dataDir, "TST"), "utf-8");
        const lines = fileContent.trim().split("\n");
        expect(lines).toHaveLength(5);

        // Verify each line can be parsed back
        for (let i = 0; i < lines.length; i++) {
          const parsed = Data.parse(lines[i]);
          // When parsing blocks without data, data should be set to {}
          expect(parsed).toEqual({ ...testBlocks[i], data: {} });
        }
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
