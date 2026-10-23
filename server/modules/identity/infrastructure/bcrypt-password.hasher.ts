import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../../../packages/platform/src";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return bcrypt.hash(value, SALT_ROUNDS);
  }

  verify(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}