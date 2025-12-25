import dotenv from "dotenv";

export default class StatusController {
	static async getStatusApi(req, res) {
		try {
			let response = {
				msg: "API status 🚀",
				name: "ebay-scraper-api",
				version: "4.0.0",
				uptime: Date.now(),
			};

			res.json(response);
		} catch (err) {
			res.status(500).json({
				error: "Unable to request API status",
				details: `${err}`,
			});
		}
	}
}
