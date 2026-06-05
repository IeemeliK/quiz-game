export async function generateQuestions(amount, topic) {
	const url = "http://localhost:1234/v1/chat/completions";

	const payload = {
		model: "local-model",
		messages: [
			{
				role: "system",
				content: `Generate question(s) about the requested topic. The answer must be fully written out text. Example format: {"questions": [{"question": "What is the capital of France?", "answer": "Paris"}]}`,
			},
			{
				role: "user",
				content: `Generate ${amount} questions about ${topic} with a simple answer for a quiz game app.`,
			},
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "quiz_questions",
				strict: true,
				schema: {
					type: "object",
					properties: {
						questions: {
							type: "array",
							items: {
								type: "object",
								properties: {
									question: {
										type: "string",
									},
									answer: {
										type: "string",
									},
								},
								required: ["question", "answer"],
								additionalProperties: false,
							},
						},
					},
					required: ["questions"],
					additionalProperties: false,
				},
			},
		},
		temperature: 0.7,
		max_tokens: 1024,
	};

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	// Parse the inner stringified JSON returned by the AI
	const parsedContent = JSON.parse(data.choices[0].message.content);

	return parsedContent.questions;
}
