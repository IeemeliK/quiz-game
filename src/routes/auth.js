import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import {
	ConflictError,
	UnauthorizedError,
	ValidationError,
} from "../lib/errors.js";

export const router = express.Router();

const SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
	const { email, password, name } = req.body;
	if (!email || !password || !name) {
		throw new ValidationError("email, password and name are required");
	}

	const existingUser = await prisma.user.findUnique({ where: { email } });

	if (existingUser) throw new ConflictError("Email already registered");

	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { email, password: hashedPassword, name },
	});

	const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });

	res.status(201).json({
		message: "User registered successfully",
		token,
	});
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		throw new ValidationError("email and password are required");
	}

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) throw new UnauthorizedError("Invalid credentials");

	const isValid = await bcrypt.compare(password, user.password);

	if (!isValid) throw new UnauthorizedError("Invalid credentials");

	const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });

	res.json({ token });
});
