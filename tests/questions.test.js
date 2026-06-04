import { beforeEach, describe, expect, it } from "vitest";
import {
	app,
	createQuestion,
	prisma,
	QUESTION_URL,
	registerAndLogin,
	request,
	resetdb,
} from "./helpers";

beforeEach(resetdb);

describe("question tests", () => {
	it("returns 401 without a token", async () => {
		const res = await request(app).get(QUESTION_URL);
		expect(res.status).toBe(401);
	});

	it("returns 404 for unknown question", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.get(`${QUESTION_URL}/9999`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
		expect(res.body.message).toBe("Question not found");
	});

	it("returns 400 for invalid post body", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.post(QUESTION_URL)
			.set("Authorization", `Bearer ${token}`)
			.send({ question: "" });

		expect(res.status).toBe(400);
	});

	it("returns 403 when editing someone else's question", async () => {
		const aliceToken = await registerAndLogin("alice@test.io", "Alice");
		const question = await createQuestion(aliceToken, {
			question: "Alice's question?",
		});

		const bobToken = await registerAndLogin("bob@test.io", "Bob");
		const res = await request(app)
			.put(`${QUESTION_URL}/${question.id}`)
			.set("Authorization", `Bearer ${bobToken}`)
			.send({ question: "Hijacked?", answers: "Yes" });

		expect(res.status).toBe(403);

		const after = await prisma.question.findUnique({
			where: { id: question.id },
		});

		expect(after.question).toBe(question.question);
	});

	it("can create a question", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.post(QUESTION_URL)
			.set("Authorization", `Bearer ${token}`)
			.send({
				question: "What is the capital of Finland?",
				answers: ["Helsinki"],
				keywords: ["geography", "finland"],
			});

		expect(res.status).toBe(201);
		expect(res.body.question).toBe("What is the capital of Finland?");
		expect(res.body.answers).toEqual(["Helsinki"]);
		expect(res.body.keywords).toEqual(
			expect.arrayContaining(["geography", "finland"]),
		);
	});

	it("can get a list of questions", async () => {
		const token = await registerAndLogin();
		await createQuestion(token, { question: "Q1" });
		await createQuestion(token, { question: "Q2" });

		const res = await request(app)
			.get(QUESTION_URL)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(2);
		expect(res.body.data[0].question).toBe("Q1");
		expect(res.body.data[1].question).toBe("Q2");
	});

	it("can get a single question", async () => {
		const token = await registerAndLogin();
		const question = await createQuestion(token, {
			question: "What is the capital of Sweden?",
			answers: ["Stockholm"],
		});

		const res = await request(app)
			.get(`${QUESTION_URL}/${question.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.question).toBe("What is the capital of Sweden?");
		expect(res.body.answers).toEqual(["Stockholm"]);
	});

	it("can update own question", async () => {
		const token = await registerAndLogin();
		const question = await createQuestion(token, {
			question: "Original question",
		});

		const res = await request(app)
			.put(`${QUESTION_URL}/${question.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ question: "Updated question", answers: ["Updated answer"] });

		expect(res.status).toBe(200);
		expect(res.body.question).toBe("Updated question");

		const dbQuestion = await prisma.question.findUnique({
			where: { id: question.id },
		});
		expect(dbQuestion.question).toBe("Updated question");
	});

	it("can delete own question", async () => {
		const token = await registerAndLogin();
		const question = await createQuestion(token);

		const res = await request(app)
			.delete(`${QUESTION_URL}/${question.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Question deleted successfully");

		const dbQuestion = await prisma.question.findUnique({
			where: { id: question.id },
		});
		expect(dbQuestion).toBeNull();
	});

	it("returns 403 when deleting someone else's question", async () => {
		const aliceToken = await registerAndLogin("alice@test.io", "Alice");
		const question = await createQuestion(aliceToken);

		const bobToken = await registerAndLogin("bob@test.io", "Bob");
		const res = await request(app)
			.delete(`${QUESTION_URL}/${question.id}`)
			.set("Authorization", `Bearer ${bobToken}`);

		expect(res.status).toBe(403);

		const dbQuestion = await prisma.question.findUnique({
			where: { id: question.id },
		});
		expect(dbQuestion).not.toBeNull();
	});

	it("can play a question", async () => {
		const token = await registerAndLogin();
		const question = await createQuestion(token, {
			answers: ["correct", "also correct"],
		});

		// Correct attempt
		let res = await request(app)
			.post(`${QUESTION_URL}/${question.id}/play`)
			.set("Authorization", `Bearer ${token}`)
			.send({ answer: "correct" });

		expect(res.status).toBe(201);
		expect(res.body.correct).toBe(true);

		// Incorrect attempt
		res = await request(app)
			.post(`${QUESTION_URL}/${question.id}/play`)
			.set("Authorization", `Bearer ${token}`)
			.send({ answer: "wrong" });

		expect(res.status).toBe(201);
		expect(res.body.correct).toBe(false);
		expect(res.body.correctAnswers).toEqual(["correct", "also correct"]);
	});

	it("returns an empty array if no random questions exist", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.get(`${QUESTION_URL}/random`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toEqual([]);
	});

	it("returns available random questions if less than 10 exist", async () => {
		const token = await registerAndLogin();
		await createQuestion(token, { question: "Q1" });
		await createQuestion(token, { question: "Q2" });

		const res = await request(app)
			.get(`${QUESTION_URL}/random`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(2);
	});

	it("returns exactly 10 random questions if more than 10 exist", async () => {
		const token = await registerAndLogin();

		for (let i = 0; i < 15; i++) {
			await createQuestion(token, { question: `Random Question ${i}` });
		}

		const res = await request(app)
			.get(`${QUESTION_URL}/random`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(10);
	});

	it("returns 400 when no file is provided", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.post(`${QUESTION_URL}/batch`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(400);
		expect(res.body.message).toBe("CSV file is required");
	});

	it("returns 400 when uploading a non-CSV file", async () => {
		const token = await registerAndLogin();
		const res = await request(app)
			.post(`${QUESTION_URL}/batch`)
			.set("Authorization", `Bearer ${token}`)
			.attach("file", Buffer.from("just some text"), "test.txt");

		expect(res.status).toBe(400);
		expect(res.body.message).toBe("Only CSV files are allowed");
	});

	it("returns 400 when the CSV header is invalid", async () => {
		const token = await registerAndLogin();
		const csvData = Buffer.from("invalid,header,row\nQ,A,K");

		const res = await request(app)
			.post(`${QUESTION_URL}/batch`)
			.set("Authorization", `Bearer ${token}`)
			.attach("file", csvData, "wrong.csv");

		expect(res.status).toBe(400);
		expect(res.body.message).toBe(
			"CSV must be in the form: question,answers,keywords",
		);
	});

	it("returns 400 when there are no data rows", async () => {
		const token = await registerAndLogin();
		const csvData = Buffer.from("question,answers,keywords\n\n");

		const res = await request(app)
			.post(`${QUESTION_URL}/batch`)
			.set("Authorization", `Bearer ${token}`)
			.attach("file", csvData, "no-data.csv");

		expect(res.status).toBe(400);
		expect(res.body.message).toBe(
			"CSV must contain a header row and at least one data row",
		);
	});

	it("can create multiple questions from a valid CSV", async () => {
		const token = await registerAndLogin();
		const csvData = Buffer.from(
			"question,answers,keywords\n" +
				"What is 2+2?,4|four,math|easy\n" +
				"Capital of France?,Paris,geography\n",
		);

		const res = await request(app)
			.post(`${QUESTION_URL}/batch`)
			.set("Authorization", `Bearer ${token}`)
			.attach("file", csvData, "questions.csv");

		expect(res.status).toBe(201);
		expect(res.body.message).toBe("Created 2 questions");
		expect(res.body.data).toHaveLength(2);

		expect(res.body.data[0].question).toBe("What is 2+2?");
		expect(res.body.data[0].answers).toEqual(
			expect.arrayContaining(["4", "four"]),
		);
		expect(res.body.data[0].keywords).toEqual(
			expect.arrayContaining(["math", "easy"]),
		);

		expect(res.body.data[1].question).toBe("Capital of France?");
		expect(res.body.data[1].answers).toEqual(["Paris"]);
		expect(res.body.data[1].keywords).toEqual(["geography"]);
	});
});
