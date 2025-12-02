import { v4 as uuidv4 } from "uuid";

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
}
