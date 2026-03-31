import express from "express";
import { questions } from '../data/questions.js'

const router = express.Router()

// GET /questions
router.get("/", (req, res) => {
	const { search } = req.query

	if (!search) {
		return res.json(questions)
	}

	const filteredQuestions = questions.filter((q) => (
		q.question.toLowerCase().includes(search.toLowerCase()))
	);

	res.json(filteredQuestions)
})

// GET /questions/:qID
router.get("/:qID", (req, res) => {
	const qID = Number(req.params.qID)
	const question = questions.find((q) => q.id === qID)

	if (!question) {
		return res.status(404).json({ message: "Question not found" })
	}

	res.json(question)
})

// POST /questions
router.post("/", (req, res) => {
	const { question, answer } = req.body

	if (!question || !answer) {
		return res.status(400).json({
			message: "Question and answer are required"
		})
	}

	const maxID = Math.max(...questions.map(q => q.id), 0)

	const newQuestion = {
		id: questions.length ? maxID + 1 : 1,
		question,
		answer
	}
	questions.push(newQuestion)
	res.status(201).json(newQuestion)
})

// PUT /questions/:qID
router.put("/:qID", (req, res) => {
	const qID = Number(req.params.qID)
	const { question, answer } = req.body

	const q = questions.find((q) => q.id === qID)
	if (!q) {
		return res.status(404).json({ message: "Question not found" })
	}

	if (!question || !answer) {
		return res.status(400).json({
			message: "Question and answer are required"
		})
	}

	q.question = question
	q.answer = answer
	res.json(q)
})

// DELETE /questions/:qID
router.delete("/:qID", (req, res) => {
	const qID = Number(req.params.qID)

	const questionIndex = questions.findIndex((q) => q.id === qID)
	if (questionIndex === -1) {
		return res.status(404).json({ message: "Question not found" })
	}

	const removed = questions.splice(questionIndex, 1)
	res.json({
		message: "Question deleted successfully",
		question: removed[0]
	})
})

export default router
