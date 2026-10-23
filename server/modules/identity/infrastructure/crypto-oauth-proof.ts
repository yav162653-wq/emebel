import { createHash, createHmac } from "node:crypto";
import type { OAuthProofFactory } from "../domain/external-auth";

export class HmacOAuthProofFactory implements OAuthProofFactory {
  constructor(private readonly secret: string) {}

  derive(state: string) {
    return {
      codeVerifier: this.deriveValue("pkce", state),
      nonce: this.deriveValue("nonce", state),
    };
  }

  challenge(codeVerifier: string): string {
    return createHash("sha256").update(codeVerifier).digest("base64url");
  }

  private deriveValue(purpose: string, state: string): string {
    return createHmac("sha256", this.secret)
      .update(`space-identity:${purpose}:${state}`)
      .digest("base64url");
  }
}
