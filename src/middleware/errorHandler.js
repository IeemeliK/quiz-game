import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { AppError } from "../lib/errors.js";

export function errorHandler(err, req, res, _next) {
	if (err instanceof ZodError) {
		return res
			.status(400)
			.json({ message: "Invalid input", issues: err.issues });
	}
	if (err instanceof multer.MulterError) {
		return res.status(400).json({ message: err.message });
	}
	if (
		err instanceof jwt.JsonWebTokenError ||
		err instanceof jwt.TokenExpiredError
	) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
	if (err instanceof AppError) {
		return res.status(err.status).json({ message: err.message });
	}
	if (err.type === "entity.parse.failed") {
		return res.status(400).json({ message: "Invalid JSON in request body" });
	}

	req.log?.error({ err }, "unhandled error");
	res.status(500).json({ message: "Internal server error" });
}
