import { db } from "../../db/client";
import { ConflictError } from "../../utils/errors";

export const NewsletterService = {
  async subscribe(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.newsletter.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictError("Email is already subscribed");
    }
    await db.newsletter.create({ data: { email: normalizedEmail } });
    return { ok: true, message: "Subscribed successfully" };
  },
};
