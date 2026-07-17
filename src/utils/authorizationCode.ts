import crypto from "node:crypto";

export function authorizationCode() {
  return crypto.randomBytes(32).toString("base64url");
}
