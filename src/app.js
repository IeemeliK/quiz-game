import express, { json } from "express";
import questionsRouter from "./routes/questions.js";
import { router as authRouter } from "./routes/auth.js";
import logger from "./lib/logger.js";
import path from "node:path";
import { errorHandler } from "./middleware/errorHandler.js";
import pinoHttp from "pino-http";

const app = express();

app.use(express.static(path.join(import.meta.dirname, "..", "public")));
app.use(
	pinoHttp({
		logger,
		autoLogging: { ignore: (req) => req.url.startsWith("/uploads") },
	}),
);

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(json());
app.use("/api/auth", authRouter);
app.use("/api/questions", questionsRouter);

app.use((_req, res) => {
	res.json({ msg: "Not Found" });
});
app.use(errorHandler);

export default app;
