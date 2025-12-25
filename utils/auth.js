export function validateApiKey(apiKeyHeaderValue) {
	if (!apiKeyHeaderValue) {
		throw new Error("Provide API key");
	}
	const decodedApiKey = Buffer.from(apiKeyHeaderValue, "base64").toString("utf-8");
	if (decodedApiKey !== process.env.API_KEY) {
		throw new Error("Unauthorized API key");
	}
	return true;
}
