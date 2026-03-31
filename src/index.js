import express, { json } from 'express';
import questionsRouter from './routes/questions.js'

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(json());
app.use("/api/questions", questionsRouter)

app.use((_req, res) => {
	res.json({ msg: "Not Found" })
})

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

