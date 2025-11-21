import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export default class StatusController {
	static async getStatusApi(req, res) {
		try {
			let response = {
				msg: "API status 🚀",
				name: process.env.API_NAME,
				environment: process.env.API_ENVIRONMENT,
				version: process.env.API_VERSION,
				uptime: new Date().getTime(),
				hash: uuidv4(),
			};

			res.json(response);
		} catch (err) {
			res.status(500).json({
				error: "Unable to request API status",
				details: `${err}`,
			});
		}
	}

	static async getStatusServer(req, res) {
		const domain = process.env.SERVER_BASE_URL;
		const controller = new AbortController();
		req.on("close", () => controller.abort());
		try {
			const response = await axios.get(
				`${domain}/b/Electronics/bn_7000259124`,
				{ signal: controller.signal }
			);
			let resp = {
				msg: "Server status 🚀",
				name: process.env.SERVER_NAME,
				environment: process.env.SERVER_ENVIRONMENT,
				version: process.env.SERVER_VERSION,
				status: `${response.status}`,
				status_text: `${response.statusText}`,
				uptime: new Date().getTime(),
				hash: uuidv4(),
			};
			res.json(resp);
		} catch (err) {
			if (err.name === "AbortError") {
				console.warn(
					`Aborted request detected: ${req.method} ${req.originalUrl}`
				);
				return; // Request was aborted due to timeout or client disconnect
			}
			res.status(503).json({
				error: "Unable to request server status",
				details: `${err}`,
			});
		}
	}
}
