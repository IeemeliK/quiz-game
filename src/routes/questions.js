import express from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { isOwner } from "../middleware/isOwner.js";
import multer from "multer";
import path from "node:path";

const storage = multer.diskStorage({
	destination: path.join(import.meta.dirname, "..", "..", "public", "uploads"),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
	},
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith("image/")) cb(null, true);
		else cb(new Error("Only image files are allowed"));
	},
	limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();
router.use(authenticate);

function formatQuestion(question) {
	const solved = question.attempts?.some((at) => at.solved) ?? false;
	return {
		...question,
		answers: question.answers.map((a) => a.answer),
		keywords: question.keywords.map((k) => k.name),
		userName: question.user?.name || null,
		attemptCount: question._count?.attempts ?? 0,
		solved,
		user: undefined,
		attempts: undefined,
		_count: undefined,
	};
}

// GET /questions
router.get("/", async (req, res) => {
	const { keyword } = req.query;
	const page = Math.max(1, parseInt(req.query.page) || 1);
	const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
	const skip = (page - 1) * limit;

	const where = keyword
		? {
				OR: [
					{ question: { contains: keyword } },
					{ keywords: { some: { name: keyword } } },
				],
			}
		: {};

	const [questions, total] = await Promise.all([
		prisma.question.findMany({
			where,
			include: {
				keywords: true,
				answers: true,
				user: true,
				attempts: { where: { userId: req.user.userId } },
				_count: { select: { attempts: true } },
			},
			orderBy: { id: "asc" },
			skip,
			take: limit,
		}),
		prisma.question.count({ where }),
	]);

	res.json({
		data: questions.map(formatQuestion),
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	});
});

// GET /questions/:qID
router.get("/:qID", async (req, res) => {
	const qID = Number(req.params.qID);
	const question = await prisma.question.findUnique({
		where: { id: qID },
		include: {
			keywords: true,
			answers: true,
			user: true,
			attempts: { where: { userId: req.user.userId } },
			_count: { select: { attempts: true } },
		},
	});

	if (!question) {
		return res.status(404).json({ message: "Question not found" });
	}

	res.json(formatQuestion(question));
});

// POST /questions
router.post("/", upload.single("image"), async (req, res) => {
	const { question, answers, keywords } = req.body;

	if (!question || !answers) {
		return res.status(400).json({
			message: "Question and answer are required",
		});
	}

	const answerArray = answers.split("\n");
	const keywordArray = keywords.split(",");
	const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

	const newQuestion = await prisma.question.create({
		data: {
			question,
			keywords: {
				connectOrCreate: keywordArray.map((kw) => ({
					where: { name: kw },
					create: { name: kw },
				})),
			},
			imageUrl,
			userId: req.user.userId,
			answers: {
				create: answerArray.map((a) => ({
					answer: a,
				})),
			},
		},
		include: {
			keywords: true,
			answers: true,
			user: true,
		},
	});

	res.status(201).json(formatQuestion(newQuestion));
});

// PUT /questions/:qID
router.put("/:qID", upload.single("image"), isOwner, async (req, res) => {
	const qID = Number(req.params.qID);
	const { question: q, answers, keywords } = req.body;

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

	const answerArray = answers.split("\n");
	const keywordArray = keywords.split(",");

	const data = {
		question: q,
		answers: {
			deleteMany: {},
			create: answerArray.map((a) => ({
				answer: a,
			})),
		},
		keywords: {
			set: [],
			connectOrCreate: keywordArray.map((kw) => ({
				where: { name: kw },
				create: { name: kw },
			})),
		},
	};
	if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

	const updatedQuestion = await prisma.question.update({
		where: { id: qID },
		data,
		include: {
			keywords: true,
			answers: true,
			user: true,
		},
	});

	res.json(formatQuestion(updatedQuestion));
});

// DELETE /questions/:qID
router.delete("/:qID", isOwner, async (req, res) => {
	const qID = Number(req.params.qID);

	const existingQuestion = await prisma.question.findUnique({
		where: { id: qID },
		include: {
			keywords: true,
			answers: true,
			user: true,
		},
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

// POST /questions/:qID/play
router.post("/:qID/play", async (req, res) => {
	const qID = Number(req.params.qID);
	const answer = req.body.answer.toLowerCase() ?? "";
	const question = await prisma.question.findUnique({
		where: { id: qID },
		include: { answers: true },
	});

	if (!question) {
		return res.status(404).json({ message: "Question not found" });
	}

	const solved = question.answers.some(
		(a) => a.answer.toLowerCase() === answer,
	);

	const attempt = await prisma.attempt.create({
		data: {
			userId: req.user.userId,
			questionId: qID,
			solved,
		},
	});

	// const attemptCount = await prisma.attempt.count({
	// 	where: { questionId: qID },
	// });

	res.status(201).json({
		id: attempt.id,
		correct: solved,
		submittedAnswer: answer,
		correctAnswers: question.answers.map((a) => a.answer),
		createdAt: attempt.createdAt,
	});
});

export default router;
