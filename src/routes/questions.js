import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

function formatQuestion(question) {
	return {
		...question,
		answers: question.answers.map((a) => a.answer),
	};
}

// GET /questions
router.get("/", async (req, res) => {
	const { search } = req.query;

	const where = search
		? {
				OR: [
					{
						question: { contains: search },
					},
					{
						answers: {
							some: {
								answer: { contains: search },
							},
						},
					},
				],
			}
		: {};

	const questions = await prisma.question.findMany({
		where,
		include: { answers: true },
		orderBy: { id: "asc" },
	});

	// const filteredQuestions = questions.filter((q) =>
	// 	q.question.toLowerCase().includes(search.toLowerCase()),
	// );

	res.json(questions.map(formatQuestion));
});

// GET /questions/:qID
router.get("/:qID", async (req, res) => {
	const qID = Number(req.params.qID);
	const question = await prisma.question.findUnique({
		where: { id: qID },
		include: { answers: true },
	});

	if (!question) {
		return res.status(404).json({ message: "Question not found" });
	}

	res.json(formatQuestion(question));
});

// POST /questions
router.post("/", async (req, res) => {
	const { question, answers } = req.body;

	if (!question || !answers) {
		return res.status(400).json({
			message: "Question and answer are required",
		});
	}

	const answerArray = Array.isArray(answers) ? answers : [];

	const newQuestion = await prisma.question.create({
		data: {
			question,
			answers: {
				create: answerArray.map((a) => ({
					answer: a,
				})),
			},
		},
		include: { answers: true },
	});

	res.status(201).json(formatQuestion(newQuestion));
});

// PUT /questions/:qID
router.put("/:qID", async (req, res) => {
	const qID = Number(req.params.qID);
	const { question: q, answers } = req.body;

	const existingQuestion = await prisma.question.findUnique({
		where: { id: qID },
	});

	if (!existingQuestion) {
		return res.status(404).json({ message: "Question not found" });
	}

	if (!q || !answers) {
		return res.status(400).json({
			message: "Question and answer are required",
		});
	}

	const answerArray = Array.isArray(answers) ? answers : [];

	const updatedQuestion = await prisma.question.update({
		where: { id: qID },
		data: {
			question: q,
			answers: {
				deleteMany: {},
				create: answerArray.map((a) => ({
					answer: a,
				})),
			},
		},
		include: { answers: true },
	});

	res.json(formatQuestion(updatedQuestion));
});

// DELETE /questions/:qID
router.delete("/:qID", async (req, res) => {
	const qID = Number(req.params.qID);

	const existingQuestion = await prisma.question.findUnique({
		where: { id: qID },
		include: { answers: true },
	});

	if (!existingQuestion) {
		return res.status(404).json({ message: "Question not found" });
	}

	await prisma.question.delete({ where: { id: qID } });

	res.json({
		message: "Question deleted successfully",
		question: formatQuestion(existingQuestion),
	});
});

export default router;
