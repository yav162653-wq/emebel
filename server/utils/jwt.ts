/**
 * JWT utility — for mobile, Telegram bot, and any stateless client.
 * Web client continues to use sessions (no change needed there).
 *
 * Usage (future):
 *   const token = JwtUtil.sign({ userId: 1, role: "user" });
 *   const payload = JwtUtil.verify(token);
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const SECRET  = env.SESSION_SECRET;   // reuse the same secret; swap to JWT_SECRET later
const EXPIRES = "7d";                  // 7 days for mobile tokens

export type JwtPayload = {
  userId: number;
  role:   string;
};

export const JwtUtil = {
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
  },

  verify(token: string): JwtPayload {
    return jwt.verify(token, SECRET) as JwtPayload;
  },

  /** Extract payload without throwing — returns null on invalid token */
  decode(token: string): JwtPayload | null {
    try {
      return this.verify(token);
    } catch {
      return null;
    }
  },
};
