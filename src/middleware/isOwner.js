import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export async function isOwner(req, _res, next) {
	const id = Number(req.params.qID);
	const question = await prisma.question.findUnique({
		where: { id },
		include: { answers: true },
	});

	if (!question) throw new NotFoundError("Question not found");

	if (question.userId !== req.user.userId) {
		throw new ForbiddenError("You can only modify your own questions");
	}

	// Attach the record to the request so the route handler can reuse it
	req.question = question;
	next();
}
