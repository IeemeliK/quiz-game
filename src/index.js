import express, { json } from "express";
import questionsRouter from "./routes/questions.js";
import { prisma } from "./lib/prisma.js";
import { router as authRouter } from "./routes/auth.js";
import path from "node:path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(import.meta.dirname, "..", "public")));

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(json());
app.use("/api/auth", authRouter);
app.use("/api/questions", questionsRouter);

app.use((_req, res) => {
	res.json({ msg: "Not Found" });
});

app.use((err, _req, res, _next) => {
	console.error(err.stack);
	res.status(500).json({ message: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
	await prisma.$disconnect;
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect;
	process.exit(0);
});
