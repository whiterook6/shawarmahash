import crypto from "crypto";

export const IdentityController = {
  /**
   * Generates a random 16-character hexadecimal identity token.
   */
  generateIdentityToken(): string {
    return crypto.randomBytes(8).toString("hex");
  },

  /**
   * Generates a derived identity token from an identity token and the server's secret.
   */
  generateDerivedIdentityToken(args: {
    identityToken: string;
    secret: string;
  }): string {
    const { identityToken, secret } = args;
    return crypto
      .createHmac("sha256", secret)
      .update(identityToken)
      .digest("hex")
      .substring(0, 16);
  },
};
