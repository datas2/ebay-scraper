import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import NodeCache from "node-cache";

import status from "./routes/status.routes.js";
import products from "./routes/products.routes.js";
import deals from "./routes/deals.routes.js";
import seller from "./routes/seller.routes.js";

// Define .env config
dotenv.config({
	path: ".env",
	override: true,
	debug: false,
	encoding: "utf-8",
});
const app = express();
const PORT = process.env.PORT || 3000;

// Define node caching settings > default 10 seconds
const MAX_CACHE_KEYS = 2000; // Maximum number of keys the cache can hold
const cache = new NodeCache({ stdTTL: 10, maxKeys: MAX_CACHE_KEYS }); // Lower TTL to free up space faster

// Utility to generate unique key based on URL and query
function getCacheKey(req) {
	return `${req.originalUrl}`;
}

// Timeout middleware: abort request if it takes longer than 15s
function timeoutMiddleware(req, res, next) {
	const timeoutMs = 15000; // 15s
	const timer = setTimeout(() => {
		if (!res.headersSent) {
			res.status(503).json({
				error: "Request timeout",
				details: "The request took longer than 15 seconds to complete.",
			});
		}
		// Destroys the connection to prevent further processing
		res.destroy && res.destroy();
	}, timeoutMs);

	// Clear the timer if response finishes before timeout
	res.on("finish", () => clearTimeout(timer));
	res.on("close", () => clearTimeout(timer));
	next();
}

// Optimized cache middleware
const verifyCache = (req, res, next) => {
	try {
		const key = getCacheKey(req);
		if (cache.has(key)) {
			return res.status(200).json(cache.get(key));
		}
		// Monkey patch res.json to cache only valid responses
		const originalJson = res.json.bind(res);
		res.json = (body) => {
			// Only cache if it is a 200 response and is not empty
			if (
				res.statusCode === 200 &&
				body &&
				Object.keys(body).length > 0
			) {
				// Custom TTL per route
				let ttl = 10;
				if (req.baseUrl.startsWith("/seller")) ttl = 60;
				if (req.baseUrl.startsWith("/products")) ttl = 10;
				try {
					cache.set(key, body, ttl);
				} catch (e) {
					// Doesn't throw an error, just doesn't save it to the cache
					console.warn("Cache error:", e.message);
				}
			}
			return originalJson(body);
		};
		return next();
	} catch (err) {
		// Never throws cache error to end user
		return next();
	}
};

app.use(express.json({ limit: "1mb" }));
app.use(timeoutMiddleware);

// Rate limiting middleware (30 requests per IP per second)
app.use(
	rateLimit({
		windowMs: 1000, // 1 second
		max: 30, // limit each IP to 30 requests per windowMs
		standardHeaders: true,
		legacyHeaders: false,
		message: {
			error: "Too many requests",
			details:
				"You have exceeded the rate limit. Please try again later.",
		},
	})
);

app.use("/", status);
app.use("/status", status);
app.use("/products", verifyCache, products);
app.use("/deals", verifyCache, deals);
app.use("/seller", verifyCache, seller);

// Global error handler for unhandled errors
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	res.status(500).json({
		error: "Internal server error",
		details: "An unexpected error occurred. Please try again later.",
	});
});

// 404 handler
app.use(/(.*)/, (req, res) => {
	res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, "0.0.0.0", () => {
	try {
		console.log(`Server running on port ${PORT}`);
		// Check Node.js memory limit (recommended to run with --max-old-space-size=1024)
		// Optionally trigger GC only if memory usage exceeds a threshold
		if (global.gc) {
			const GC_HEAP_THRESHOLD = 0.8; // 80% of heap used
			try {
				setInterval(() => {
					const mem = process.memoryUsage();
					if (mem.heapUsed / mem.heapTotal > GC_HEAP_THRESHOLD) {
						console.log(
							`[GC] Forcing garbage collection at ${new Date().toISOString()} (heapUsed: ${(
								mem.heapUsed /
								1024 /
								1024
							).toFixed(2)} MB, heapTotal: ${(
								mem.heapTotal /
								1024 /
								1024
							).toFixed(2)} MB)`
						);
						global.gc();
					}
				}, 600000); // Check garbage collection each 10 minutes (600000 ms)
			} catch (err) {
				console.warn(
					"Garbage collection is not exposed. Run the app with `node --expose-gc` to enable it."
				);
			}
		}
	} catch (err) {
		console.log(err);
		process.exit();
	}
});

export default app;
