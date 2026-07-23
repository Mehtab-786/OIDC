// setup the express server, route iniatize and middlewares etc
import express from "express";
import path from "node:path";
import oidcRoutes from "./routes/oidc.routes.js";
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.static(path.resolve("public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", oidcRoutes);

// middleware to throw json error to frontend instead of HTML format (purpose - ease of showing errors)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});

export default app;
