import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

const testSecret = "jwt-test-secret-with-enough-entropy";

async function loadJwtUtil() {
  process.env.SESSION_SECRET = testSecret;
  return import("./jwt");
}

test("JWT verification returns validated user and role claims", async () => {
  const { JwtUtil } = await loadJwtUtil();
  const token = JwtUtil.sign({ userId: 7, role: "user" });

  assert.deepEqual(JwtUtil.verify(token), { userId: 7, role: "user" });
});

test("JWT verification rejects invalid payload claims", async () => {
  const { JwtUtil } = await loadJwtUtil();
  const token = jwt.sign({ userId: "7", role: "owner" }, testSecret);

  assert.throws(() => JwtUtil.verify(token));
  assert.equal(JwtUtil.decode(token), null);
});
