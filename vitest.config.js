import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
export default defineConfig({
	test: {
		pool: "forks",
		fileParallelism: false,
		environment: "node",
		globals: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.js"],
			exclude: ["src/generated/**", "src/index.js"],
		},
	},
});
