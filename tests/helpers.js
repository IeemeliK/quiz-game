import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const REGISTER_URL = "/api/auth/register";
export const LOGIN_URL = "/api/auth/login";
export const QUESTION_URL = "/api/questions";

export async function resetdb() {
	await prisma.user.deleteMany();
	await prisma.attempt.deleteMany();
	await prisma.answer.deleteMany();
	await prisma.question.deleteMany();
	await prisma.keyword.deleteMany();
}

export async function registerAndLogin(email = "a@test.io", name = "A") {
	await request(app)
		.post(REGISTER_URL)
		.send({ email, password: "pw12345", name });
	const res = await request(app)
		.post(LOGIN_URL)
		.send({ email, password: "pw12345" });

	return res.body.token;
}

export async function createQuestion(token, overrides = {}) {
	const res = await request(app)
		.post(QUESTION_URL)
		.set("Authorization", `Bearer ${token}`)
		.send({
			question: "T?",
			answers: ["Some answer"],
			...overrides,
		});
	return res.body;
}

export { request, app, prisma };
