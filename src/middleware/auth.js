import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
const SECRET = process.env.JWT_SECRET;

export function authenticate(req, _res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		throw new UnauthorizedError("No token provided");
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, SECRET);
		req.user = decoded;
		next();
	} catch (err) {
		throw new ForbiddenError("Invalid or expired token");
	}
}
