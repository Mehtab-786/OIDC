import express, { type Request, type Response } from "express";
import {
  getAuthorizeController,
  jwksController,
  postAuthorizeController,
  getRegistrationController,
  tokenController,
  userinfoController,
  postRegistrationController,
  getSignUpController,
  postSignUpController,
} from "../controllers/oidc.controller.js";
import path from "node:path";

const ISSUER = "http://localhost:3000";

const Router = express.Router();

Router.get("/", (req: Request, res: Response) => {
  return res.sendFile(path.resolve("public", "HomePage.html"));
});

Router.get("/health", (req: Request, res: Response) =>
  res.json({ message: "Server is healthy", healthy: true }),
);

Router.get(
  "/.well-known/openid-configuration",
  async (req: Request, res: Response) => {
    return res.status(200).json({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      userinfo_endpoint: `${ISSUER}/userinfo`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/jwks`,
      registration_client: `${ISSUER}/registration`,
    });
  },
);

Router.route("/authorize")
  .get(getAuthorizeController)
  .post(postAuthorizeController);

Router.route("/signup").get(getSignUpController).post(postSignUpController);

Router.get("/userinfo", userinfoController);

Router.post("/token", tokenController);

Router.route("/registration")
  .get(getRegistrationController)
  .post(postRegistrationController);

Router.get("/jwks", jwksController);

export default Router;
