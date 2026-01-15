import { BaseService } from "./base";
import { type Block, type TestMintRequest } from "./types";

export class TestService extends BaseService {
  async mintBlock(payload: TestMintRequest): Promise<Block> {
    const response = await fetch("/test/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<Block>(response);
  }
}
