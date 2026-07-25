import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "../db/client";
import { logger } from "./logger";

// ── Local Strategy ─────────────────────────────────────────────────────────
// Looks up the 'local' Identity by username (providerId), then verifies hash.
passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const identity = await db.identity.findUnique({
          where: { provider_providerId: { provider: "local", providerId: username } },
          include: { user: true },
        });

        if (!identity) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const creds = identity.credentials as { hash?: string };
        if (!creds.hash) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, creds.hash);
        if (!valid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, identity.user);
      } catch (err) {
        logger.error({ err }, "Passport LocalStrategy error");
        return done(err);
      }
    }
  )
);

// ── Session Serialization ──────────────────────────────────────────────────
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

export default passport;
