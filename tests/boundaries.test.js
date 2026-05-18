import { beforeEach, describe, expect, it } from "vitest";
import {
	app,
	QUESTION_URL,
	registerAndLogin,
	request,
	resetdb,
} from "./helpers";

beforeEach(resetdb);

describe("Boundary testing", () => {
	it("clamps limit above 100 to 100", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.get(`${QUESTION_URL}?limit=999`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.limit).toBe(100);
	});

	it("treats page=0 and page=-1 as page=1", async () => {
		const token = await registerAndLogin();
		const responses = await Promise.all([
			request(app)
				.get(`${QUESTION_URL}?page=0`)
				.set("Authorization", `Bearer ${token}`),
			request(app)
				.get(`${QUESTION_URL}?page=-1`)
				.set("Authorization", `Bearer ${token}`),
		]);

		for (const res of responses) {
			expect(res.status).toBe(200);
			expect(res.body.page).toBe(1);
		}
	});
});
