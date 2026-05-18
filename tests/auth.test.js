import bcrypt from "bcrypt";
import {
	app,
	LOGIN_URL,
	prisma,
	REGISTER_URL,
	request,
	resetdb,
} from "./helpers";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(resetdb);

describe("auth-tests", () => {
	it("registers, hashes the password, returns a token", async () => {
		const res = await request(app)
			.post(REGISTER_URL)
			.send({ email: "a@test.io", password: "pw12345", name: "A" });

		expect(res.status).toBe(201);
		expect(res.body.token).toEqual(expect.any(String));

		const user = await prisma.user.findUnique({
			where: { email: "a@test.io" },
		});
		expect(user.password).not.toBe("pw12345");
		expect(await bcrypt.compare("pw12345", user.password)).toBe(true);
	});

	it("registering with duplicate email returns 409", async () => {
		await request(app)
			.post(REGISTER_URL)
			.send({ email: "a@test.io", password: "pw12345", name: "A" });

		const res = await request(app)
			.post(REGISTER_URL)
			.send({ email: "a@test.io", password: "pw1245", name: "B" });

		expect(res.status).toBe(409);
	});

	it("registering with missing info returns 400", async () => {
		const responses = await Promise.all([
			request(app).post(REGISTER_URL).send({ password: "pw12345", name: "A" }),
			request(app).post(REGISTER_URL).send({ email: "a@test.io", name: "A" }),
			request(app)
				.post(REGISTER_URL)
				.send({ email: "a@test.io", password: "pw12345" }),
		]);

		for (const res of responses) {
			expect(res.status).toBe(400);
			expect(res.body.message).toEqual("email, password and name are required");
		}
	});

	it("returns 400 when logging with wrong/missing credentials", async () => {
		const res = await request(app).post(LOGIN_URL).send({ email: "" });
		expect(res.status).toBe(400);
	});

	it("logs in successfully, returns token", async () => {
		await request(app)
			.post(REGISTER_URL)
			.send({ email: "a@test.io", password: "pw12345", name: "A" });

		const res = await request(app)
			.post(LOGIN_URL)
			.send({ email: "a@test.io", password: "pw12345" });

		expect(res.status).toBe(200);
		expect(res.body.token).toEqual(expect.any(String));
	});

	it("log in with wrong credentials returns 401: Invalid credentials", async () => {
		await request(app)
			.post(REGISTER_URL)
			.send({ email: "a@test.io", password: "pw12345", name: "A" });

		const responses = await Promise.all([
			request(app)
				.post(LOGIN_URL)
				.send({ email: "a@test.io", password: "pw125" }),
			request(app)
				.post(LOGIN_URL)
				.send({ email: "a@t.io", password: "pw12345" }),
		]);

		for (const res of responses) {
			expect(res.status).toBe(401);
			expect(res.body.message).toEqual("Invalid credentials");
		}
	});
});
