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
import validate from "../middlewares/validate.middlewares.js";
import LoginDTO from "../utils/DTO/dto/login.dto.js";
import RegisterDTO from "../utils/DTO/dto/register.dto.js";
import ClientDTO from "../utils/DTO/dto/client.dto.js";

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
  .post(validate(LoginDTO), postAuthorizeController);

Router.route("/signup")
  .get(getSignUpController)
  .post(validate(RegisterDTO), postSignUpController);

Router.get("/userinfo", userinfoController);

Router.post("/token", tokenController);

Router.route("/registration")
  .get(getRegistrationController)
  .post(validate(ClientDTO), postRegistrationController);

Router.get("/jwks", jwksController);

export default Router;
