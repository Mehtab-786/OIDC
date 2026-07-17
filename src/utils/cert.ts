import fs from "node:fs";
import path from "node:path";
import { importSPKI, exportJWK, importPKCS8 } from "jose";

export const PRIVATE_KEY = fs.readFileSync( path.join(process.cwd(), "keys", "private.pem"), "utf8" );

export const PUBLIC_KEY = fs.readFileSync( path.join(process.cwd(), "keys", "public.pem"), "utf8" );


export async function publicKeyShowing() {
  const key = await importSPKI(PUBLIC_KEY, "RS256");
  const jwk = await exportJWK(key);
  return jwk;
};

export async function privateKeyShowing() {
  const key = await importPKCS8(PRIVATE_KEY, "RS256");
  return key;
};
