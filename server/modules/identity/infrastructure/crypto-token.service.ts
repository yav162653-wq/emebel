import { createHash, randomBytes } from "node:crypto";
import type { OneTimeTokenService } from "../../../../packages/platform/src";

export class CryptoOneTimeTokenService implements OneTimeTokenService {
  issue(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString("base64url");
    return { raw, hash: this.hash(raw) };
  }

  hash(raw: string): string {
    return createHash("sha256").update(raw, "utf8").digest("hex");
  }
}