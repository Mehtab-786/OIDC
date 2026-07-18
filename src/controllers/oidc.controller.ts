import path from "node:path";
import { type Request, type Response } from "express";
import { authcode, clients, refreshtoken, users } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import { generateClientCredentials } from "../utils/clientCredentials.js";
import bcrypt from "bcryptjs";
import { authorizationCode } from "../utils/authorizationCode.js";
import {
  PRIVATE_KEY,
  PUBLIC_KEY,
  publicKeyShowing,
} from "../utils/cert.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { generateRandomString } from "../utils/jwtTokens.js";

const ISSUER = "http://localhost:3000";
const SALT = Number(process.env.SALT) || 10;

async function getAuthorizeController(req: Request, res: Response) {
  // get values from url
  // check in db if exists both
  // if true redirect login page
  // else error page

  let { client_id, redirect_uri } = req.query;

  let [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.clientId, client_id as string));

  if (client && client.redirectUri === redirect_uri) {
    return res.sendFile(path.resolve("public", "SignIn.html"));
  }

  return res.sendFile(path.resolve("public", "ErrorPage.html"));
}

type PostAuthorizeBody = {
  email: string;
  password: string;
  redirect_uri: string;
  client_id: string;
};

async function postAuthorizeController(
  req: Request<{}, {}, PostAuthorizeBody>,
  res: Response,
) {
  // login user
  // take email, password & check it
  // check in db
  // redirect to redirect_uri with code

  const { email, password, redirect_uri, client_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  let isPassword = await bcrypt.compare(password, user.password);

  if (!isPassword) {
    return res
      .status(404)
      .json({ message: "Email or password is incorrect!!" });
  }

  const code = authorizationCode();

  await db.insert(authcode).values({
    clientId: client_id,
    code,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    userId: user.id,
    used: false,
  });

  return res.status(200).json({
    message: "User logged in successfully",
    data: {
      username: user.username,
      email: user.email,
      code,
    },
  });
}

async function getSignUpController(req: Request, res: Response) {
  // route already coming from login with client id & redirect uri so no need to check
  return res.sendFile(path.resolve("public", "SignUp.html"));
}
async function postSignUpController(req: Request, res: Response) {
  // registering user
  // username, password, email
  // validation,
  // check in db if already exists
  // if not hash password
  // insert in db
  // generate code
  //  redirect user with code

  const { username, password, email, client_id, redirect_uri } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Email, password, & username required",
    });
  }

  if (!client_id || !redirect_uri) {
    return res.status(400).json({
      message: "You are not authorized to authenticate!",
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

  let [userCreated] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      username,
    })
    .returning();

  if (!userCreated) {
    return res.status(500).json({ message: "Internal server error" });
  }

  const code = await authorizationCode();

  await db.insert(authcode).values({
    clientId: client_id,
    code,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // ----------------------> uncoment it xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    userId: userCreated.id,
    used: false,
  });

  return res.status(200).json({
    message: "User Signed up successfully",
    data: {
      username: userCreated.username,
      email: userCreated.email,
      code,
    },
  });
}

async function userinfoController(req: Request, res: Response) {
  // get access token
  // verify & return user details

  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing access token" });
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json({ message: "Missing access token" });
  }

  const payload = jwt.verify(accessToken, PUBLIC_KEY, {
    algorithms: ["RS256"],
  }) as JwtPayload


  if (payload.iss !== ISSUER) {
    return res.status(401).json({ message: "Invalid issuer" });
  }


  // if (payload.aud !== expectedClientId) {
  //   return res.status(401).json({ message: "Invalid audience" });
  // }

  if (!payload.sub) {
    return res.status(401).json({ message: "Invalid subject" });
  }

  let [user] = await db.select({ username: users.username, email: users.email }).from(users).where(eq(users.id, payload.sub))

  if (!user) {
    return res.status(401).json({ message: "Invalid user" });
  }

  // if(String(payload.sub) !== String(users.id)){
  //   return res.status(401).json({ message: "Invalid id not matching" });
  // }

  return res.json({ message: "Access Token", userinfo: user })
}


async function jwksController(req: Request, res: Response) {
  // show public keys, keep private keys

  let jwk = await publicKeyShowing();
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwk.kid = "22f8c7201a4f789258f1e3a8ec364c33afa435f53c4a4ffeaf302113b4c93f4a";

  return res.status(200).json({
    keys: [jwk],
  });
}

async function tokenController(req: Request, res: Response) {
  // get code , client id & secret, redirect uri in request body
  // // return access & refresh token, id token, token type, expires in
  // delete code from db

  const { code, client_id, client_secret, redirect_uri } = req.body;

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return res.status(404).json({ message: "Fields are missing!" });
  }

  const [authorizeCode] = await db
    .select()
    .from(authcode)
    .where(eq(authcode.code, code))
    .limit(1);

  if (!authorizeCode) {
    return res.status(404).json({ message: "Authorization code is missing!" });
  }

  if (Date.now() > authorizeCode.expiresAt.getTime()) {
    return res.status(400).json({ message: "Authorization code has expired" });
  }

  if (
    authorizeCode.clientId !== client_id ||
    authorizeCode.redirectUri !== redirect_uri
  ) {
    return res.status(400).json({ message: "Invalid Credentials !" });
  }

  const [client] = await db
    .select({ id: clients.id, client_id: clients.clientId })
    .from(clients)
    .where(eq(clients.clientSecret, client_secret));

  if (!client) {
    return res.status(400).json({ message: "Invalid Credentials !" });
  }
  if (client.client_id !== client_id) {
    return res.status(400).json({ message: "Invalid Credentials !" });
  }

  const payload = {
    iss: ISSUER,
    sub: authorizeCode.userId,
    aud: authorizeCode.clientId,
  };

  let access_token = await jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "5m", //     ---------------> uncoment it xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                                
    // expiresIn: "1d", 
  });
  let refresh_token = await generateRandomString();
  let token_type = "Bearer";
  let expires_in = 300;

  await db.insert(refreshtoken).values({
    clientId: client_id,
    token: refresh_token,
    userId: authorizeCode.userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await db.delete(authcode).where(eq(authcode.code, code));

  const now = Math.floor(Date.now() / 1000);

  const idTokenPayload = {
    iss: ISSUER,
    sub: authorizeCode.userId,
    aud: authorizeCode.clientId,
    iat: now,
    exp: now + 300, // 5 minutes ----------------------------------> uncomment it xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // exp: now + 3000000, // 50 minutes
  };

  let id_token = await jwt.sign(idTokenPayload, PRIVATE_KEY, { algorithm: 'RS256' })

  return res.status(200).json({
    access_token,
    refresh_token: refresh_token,
    id_token,
    token_type,
    expires_in,
  });
}

async function getRegistrationController(req: Request, res: Response) {
  // show registration page to client
  return res.sendFile(path.resolve("public", "ClientRegistration.html"));
}
async function postRegistrationController(req: Request, res: Response) {
  const { applicationName, applicationUrl, redirectUri } = req.body;

  if (!applicationName || !applicationUrl || !redirectUri) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const isClient = await db
    .select()
    .from(clients)
    .where(eq(clients.applicationName, applicationName));

  if (isClient.length > 0) {
    return res.status(400).json({ message: "Client already exists" });
  }

  const { clientId, clientSecret } = generateClientCredentials();

  const newClient = await db.insert(clients).values({
    applicationName,
    applicationUrl,
    redirectUri,
    clientId,
    clientSecret,
  });

  if (!newClient) {
    return res.status(500).json({ message: "Internal server error" });
  }

  res.status(200).json({
    messaga: "Client registered",
    data: {
      clientId,
      clientSecret,
    },
  });

  // get app name, url, redirect uri etc
  // return cient ID & secret
}

export {
  getAuthorizeController,
  postAuthorizeController,
  userinfoController,
  jwksController,
  tokenController,
  getRegistrationController,
  postRegistrationController,
  getSignUpController,
  postSignUpController,
};
