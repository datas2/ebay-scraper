import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import status from "./routes/status.routes.js";
import products from "./routes/products.routes.js";
import seller from "./routes/seller.routes.js";

// Load environment variables
dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON body
app.use(express.json({ limit: "1mb" }));

// Basic rate limiting (30 requests por IP por segundo)
app.use(
	rateLimit({
		windowMs: 1000, // 1 segundo
		max: 30,
		standardHeaders: true,
		legacyHeaders: false,
		message: {
			error: "Too many requests",
			details:
				"You have exceeded the rate limit. Please try again later.",
		},
	})
);

// Routes
app.use("/", status);
app.use("/status", status);
app.use("/products", products);
app.use("/seller", seller);

// Global error handler
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	res.status(500).json({
		error: "Internal server error",
		details: "An unexpected error occurred. Please try again later.",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;
