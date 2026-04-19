import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const seedQuestions = [
	{
		content: "What does json stand for?",
		answers: ["Javascript Object Notation"],
	},
	{
		content: "What is the http code for a succesful GET request?",
		answers: ["200"],
	},
	{
		content: "What is npm?",
		answers: ["It is a package manager for node"],
	},
	{
		content: "What is node?",
		answers: ["A javascript runtime"],
	},
];

async function main() {
	await prisma.question.deleteMany();
	await prisma.answer.deleteMany();

	for (const q of seedQuestions) {
		await prisma.question.create({
			data: {
				question: q.content,
				answers: {
					create: q.answers.map((a) => ({
						answer: a,
					})),
				},
			},
		});
	}

	console.log("Seeded");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect);
