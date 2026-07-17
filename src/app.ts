// // Express app, routes, middleware.
import express from "express";
import path from "node:path";
import oidcRoutes from "./routes/oidc.routes.js";

const app = express();


app.use(express.static(path.resolve("public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", oidcRoutes);

export default app;
