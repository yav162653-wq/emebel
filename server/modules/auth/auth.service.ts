import bcrypt from "bcryptjs";
import { db } from "../../db/client";
import { UnauthorizedError, ConflictError, NotFoundError } from "../../utils/errors";

const SALT_ROUNDS = 12;

type SafeUser = { id: number; username: string; name: string; role: string };

function toSafeUser(user: { id: number; username: string; name: string; role: string }): SafeUser {
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

export const AuthService = {
  async login(username: string, password: string): Promise<SafeUser> {
    const user = await db.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    return toSafeUser(user);
  },

  async register(data: {
    username: string;
    password: string;
    name: string;
  }): Promise<SafeUser> {
    const existing = await db.user.findUnique({ where: { username: data.username } });
    if (existing) throw new ConflictError("Username already taken");

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await db.user.create({
      data: { username: data.username, password: hashed, name: data.name, role: "user" },
    });

    return toSafeUser(user);
  },

  async getById(id: number): Promise<SafeUser | null> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return null;
    return toSafeUser(user);
  },
};
