import pino from "pino";

export default pino({
	level: process.env.LOG_LEVEL || "info",
	redact: {
		paths: ["req.headers.authorization", "req.body.password", "*.password"],
		censor: "[REDACTED]",
	},
	transport:
		process.env.NODE_ENV !== "production"
			? { target: "pino-pretty" }
			: undefined,
});
