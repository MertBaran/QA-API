import dotenv from "dotenv";
import path from "path";

let envFile = "config.env";
if (process.env["NODE_ENV"] === "production") {
  envFile = "config.env.prod";
} else if (process.env["NODE_ENV"] === "docker") {
  envFile = "config.env.docker";
} else if (process.env["NODE_ENV"] === "test") {
  envFile = "config.env.test";
} else {
  // Default to development config
  envFile = "config.env";
}

// Fix path for both source and compiled versions
const configPath = path.resolve(__dirname, `../config/env/${envFile}`);
dotenv.config({ path: configPath });

import "reflect-metadata";
import express, { Request, Response, Application } from "express";
import cors from "cors";
import routers from "./routers";
import customErrorHandler from "./middlewares/errors/customErrorHandler";
import "./services/container";
import { container } from "tsyringe";

const app: Application = express();

// CORS and Language Middleware
app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
  })
);

// Body Middleware
app.use(express.json());

const PORT: number = parseInt(process.env["PORT"] || "3000");

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// Use Routers Middleware
app.use("/api", routers);

// Custom Error Handler - MUST BE LAST
app.use(customErrorHandler);

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Database Connection
async function startServer() {
  // Connect to database (MongoDB connection success message will be shown)
  const databaseAdapter = container.resolve<any>("DatabaseAdapter");
  await databaseAdapter.connect();

  // Only start the server if this is the main module (not imported for testing)
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(
        `🚀 Server is running on port ${PORT} : ${process.env["NODE_ENV"]}`
      );
    });
  }
}

if (require.main === module) {
  startServer();
}

export default app;
