import { describe, it } from "node:test";
import { IdentityController } from "./identity.controller";
import expect from "expect";

describe("IdentityController", () => {
  describe("generateIdentityToken", () => {
    it("It can generate a random identity token", () => {
      const identityToken = IdentityController.generateIdentityToken();
      expect(identityToken).toBeDefined();
      expect(identityToken.length).toBe(16);
    });

    it("It can generate a derived identity token from an identity token and a secret", () => {
      const identityToken = IdentityController.generateIdentityToken();
      const secret = "test-secret";
      const derivedIdentityToken =
        IdentityController.generateDerivedIdentityToken({
          identityToken,
          secret,
        });
      expect(derivedIdentityToken).toBeDefined();
      expect(derivedIdentityToken.length).toBe(16);
    });
  });
});
