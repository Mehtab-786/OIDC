import express, { type Request, type Response } from "express";
import fs from "node:fs";
import { importSPKI, exportJWK } from "jose";
import path from "node:path";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PRIVATE_KEY, PUBLIC_KEY } from "./utils/cert.js";

let SALT = 10;

async function main() {
  const app = express();
  const PORT = 3000;
  const ISSUER = "http://localhost:3000";

  app.use(express.static(path.resolve("public")));
  app.use(express.json());
  app.get("/", (req: Request, res: Response) =>
    res.json({ message: "Hello from Auth Server" }),
  );

  app.get("/health", (req: Request, res: Response) =>
    res.json({ message: "Server is healthy", healthy: true }),
  );

  app.get(
    "/.well-known/openid-configuration",
    async (req: Request, res: Response) => {
      return res.status(200).json({
        issuer: ISSUER,
        authorization_url: `${ISSUER}/v1/authenticate/sign-in`,
        userinfo_endpoint: `${ISSUER}/v1/userinfo`,
        jwks_uri: `${ISSUER}/v1/jwks`,
      });
    },
  );

  app.get("/v1/authenticate/sign-in", async (req, res) => {
    return res.sendFile(path.resolve("public", "SignIn.html"));
  });

  app.post("/v1/authenticate/sign-in", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email & Password are required",
      });
    }

    const [userExists] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!userExists) {
      return res
        .status(404)
        .json({ message: "Email or password is incorrect!!" });
    }

    let isPassword = await bcrypt.compare(password, userExists.password);

    if (!isPassword) {
      return res
        .status(404)
        .json({ message: "Email or password is incorrect!!" });
    }

    const token = jwt.sign({ id: userExists.id }, PRIVATE_KEY, {
      algorithm: "RS256",
    });

    return res.json({
      token,
    });
  });

  app.post("/v1/authenticate/sign-up", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Email, password, & username required",
      });
    }

    const [existingUser] = await db
      .select({ id: users.id }) // used id because only need to know user exists or no
      .from(users)
      .where(eq(users.email, email))
      .limit(1); // it returns an array, that's why destructured

    if (existingUser) {
      return res.status(409).json({
        message: "Account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT);

    let userCreated = await db.insert(users).values({
      email,
      password: hashedPassword,
      username,
    });

    if (!userCreated) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json({
      success: true,
      message: "Account created successfully",
    });
  });

  app.get("/v1/userinfo", async (req, res) => {
    const auth = req.headers?.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or malformed" });
    }

    const token = auth.slice(7);

    interface TokenPayload extends jwt.JwtPayload {
      id: string;
    }

    try {
      let decoded = jwt.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"],
      }) as TokenPayload;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id));

      return res.status(200).json({ ok: true, user });
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token." });
      return;
    }
  });

  app.get("/v1/jwks", async (req, res) => {
    const pem = fs.readFileSync(path.join(process.cwd(), "keys", 'public.pem'), "utf8");
    
    fs.readFileSync(
      path.join(process.cwd(), "keys", "public.pem"),
      "utf8"
    );
    
    
    const key = await importSPKI(pem, "RS256");

    const jwk = await exportJWK(key);

    console.log(jwk);

    res.status(200).json({
      key:jwk
    })
  });

  app.listen(PORT, () => {
    console.log(`Auth Server is running on port:${PORT}`);
  });
}

main();
