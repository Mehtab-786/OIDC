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
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";

const ISSUER = process.env.ISSUER_URL;
const SALT = Number(process.env.SALT) || 10;

async function getAuthorizeController(req: Request, res: Response) {
  // get client_id & redirect_uri from url
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
  // get email, password, redirect_uri, client_id from request body
  // check in database
  // redirect to redirect_uri with code

  const { email, password, redirect_uri, client_id } = req.body;

  if (!email || !password) {
    throw APIError.notFound('Credentials are required!')
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    throw APIError.unauthorized('Invalid Credentials!')
  }

  let isPassword = await bcrypt.compare(password, user.password);

  if (!isPassword) {
    throw APIError.unauthorized('Invalid Credentials!')
  }

  const code = authorizationCode();

  if (!code) {
    throw APIError.internalError('Something went wrong!')
  }

  await db.insert(authcode).values({
    clientId: client_id,
    code,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    userId: user.id,
    used: false,
  });

  return APIResponse.ok(res, 'User logged in successfully', {
    username: user.username,
    email: user.email,
    code,
  })
}

async function getSignUpController(req: Request, res: Response) {
  // route already coming from login with client id & redirect uri so no need to check
  return res.sendFile(path.resolve("public", "SignUp.html"));
}
async function postSignUpController(req: Request, res: Response) {
  // username, password, email, client_id, redirect_uri from request body
  // validate values
  // check in database if already exists
  // if not hash password
  // insert in database
  // generate code
  // redirect user with code

  const { username, password, email, client_id, redirect_uri } = req.body;

  if (!username || !email || !password) {
    throw APIError.notFound('Credentials are required!')
  }

  if (!client_id || !redirect_uri) {
    throw APIError.unauthorized('You are not authorized to authenticate!')
  }

  const [existingUser] = await db
    .select({ id: users.id }) //only get used-id as data
    .from(users)
    .where(eq(users.email, email))
    .limit(1); // it return only one data

  if (existingUser) {
    throw APIError.conflict('Account already exists!')
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
    throw APIError.internalError('Something went wrong!')
  }

  const code = await authorizationCode();

  await db.insert(authcode).values({
    clientId: client_id,
    code,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    userId: userCreated.id,
    used: false,
  });

  return APIResponse.created(res, 'User signed up successfully', {
    username: userCreated.username,
    email: userCreated.email,
    code,
  })
}

async function userinfoController(req: Request, res: Response) {
  // receive access token as Bearer token
  // authenticate and return user details

  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw APIError.notFound('Missing access token!')
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    throw APIError.unauthorized('Missing access token!')
  }

  const payload = jwt.verify(accessToken, PUBLIC_KEY, {
    algorithms: ["RS256"],
  }) as JwtPayload


  if (payload.iss !== ISSUER) {
    throw APIError.unauthorized('Invalid issuer!')
  }

  if (!payload.sub) {
    throw APIError.notFound('Invalid subject!')
  }

  let [user] = await db.select({ username: users.username, email: users.email }).from(users).where(eq(users.id, payload.sub))

  if (!user) {
    throw APIError.notFound('Invalid user!')
  }

  return APIResponse.ok(res, 'Successfully fetched userinfo', user)
}

async function jwksController(req: Request, res: Response) {
  // show public keys, keep private keys

  let jwk = await publicKeyShowing();
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwk.kid = "22f8c7201a4f789258f1e3a8ec364c33afa435f53c4a4ffeaf302113b4c93f4a";

  return APIResponse.ok(res, 'Successfully fetched JWKS', { keys: [jwk] })
}

async function tokenController(req: Request, res: Response) {
  // get code, client_id & secret, redirect_uri from request body
  // verify code, find user, client etc and validate
  // generate access & refresh token, id_token, token_type, expires_in and return
  // delete code from database

  const { code, client_id, client_secret, redirect_uri } = req.body;

  if (!code || !client_id || !client_secret || !redirect_uri) {
    throw APIError.notFound('Fields are missing!')
  }

  const [authorizeCode] = await db
    .select()
    .from(authcode)
    .where(eq(authcode.code, code))
    .limit(1);

  if (!authorizeCode) {
    throw APIError.notFound('Authorization code is missing!')
  }

  if (Date.now() > authorizeCode.expiresAt.getTime()) {
    throw APIError.badRequest('Authorization code has expired!')
  }

  if (
    authorizeCode.clientId !== client_id ||
    authorizeCode.redirectUri !== redirect_uri
  ) {
    throw APIError.unauthorized('Invalid Credentials!')
  }

  const [client] = await db
    .select({ id: clients.id, client_id: clients.clientId })
    .from(clients)
    .where(eq(clients.clientSecret, client_secret));

  if (!client) {
    throw APIError.notFound('Invalid Credentials!')
  }
  if (client.client_id !== client_id) {
    throw APIError.unauthorized('Invalid Credentials!')
  }

  const payload = {
    iss: ISSUER,
    sub: authorizeCode.userId,
    aud: authorizeCode.clientId,
  };

  let access_token = await jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "5m"
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
    exp: now + 300
  };

  let id_token = await jwt.sign(idTokenPayload, PRIVATE_KEY, { algorithm: 'RS256' })

  return APIResponse.ok(res, 'Tokens generated successfully', {
    access_token,
    refresh_token,
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
  // client will register themselves here 
  // validate input values
  // if already exists then error,
  // else create one

  const { applicationName, applicationUrl, redirectUri } = req.body;

  if (!applicationName || !applicationUrl || !redirectUri) {
    throw APIError.notFound("Missing required fields")
  }

  const isClient = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.applicationName, applicationName))
    .limit(1);

  if (isClient.length > 0) {
    throw APIError.conflict("Client already exists");
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
    throw APIError.internalError("Something went wrong!");
  }

  return APIResponse.created(res, "Client registered", {
    clientId,
    clientSecret,
  });
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
