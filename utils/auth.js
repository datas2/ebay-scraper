import dotenv from "dotenv";

// Define .env config
dotenv.config();

const { API_KEY } = process.env;

export function validateApiKey(apiKeyHeaderValue) {
	if (!apiKeyHeaderValue) {
		throw new Error("Provide API key");
	}
	const api_key = Buffer.from(apiKeyHeaderValue, "base64").toString();
	if (api_key !== process.env.API_KEY) {
		throw new Error("Unauthorized API key");
	}
	return true;
}
