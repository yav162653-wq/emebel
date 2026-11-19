/**
 * JWT utility — for mobile, Telegram bot, and any stateless client.
 * Web client continues to use sessions (no change needed there).
 *
 * Usage (future):
 *   const token = JwtUtil.sign({ userId: 1, role: "user" });
 *   const payload = JwtUtil.verify(token);
 */
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { userRoleSchema } from "../../lib/api-zod/src";

const SECRET  = env.SESSION_SECRET;   // reuse the same secret; swap to JWT_SECRET later
const EXPIRES = "7d";                  // 7 days for mobile tokens

const jwtPayloadSchema = z.object({
  userId: z.number().int().positive(),
  role: userRoleSchema,
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export const JwtUtil = {
  sign(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
  },

  verify(token: string): JwtPayload {
    const payload = jwt.verify(token, SECRET);
    return jwtPayloadSchema.parse(payload);
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
