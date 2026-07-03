import fs from "node:fs";
import path from "node:path";

// export const PUBLIC_KEY = fs.readFileSync(path.resolve('../../keys/public.pem'));
// export const PRIVATE_KEY = fs.readFileSync(path.resolve('../../keys/private.pem'));

export const PRIVATE_KEY = fs.readFileSync(
  path.join(process.cwd(), "keys", "private.pem"),
  "utf8"
);
export const PUBLIC_KEY = fs.readFileSync(
  path.join(process.cwd(), "keys", "public.pem"),
  "utf8"
);