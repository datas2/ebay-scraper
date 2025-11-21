// __tests__/controllers/status.controller.test.js

import StatusController from "../../controllers/status.controller.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

jest.mock("axios");
jest.mock("uuid", () => ({
	v4: jest.fn(() => "mocked-uuid"),
}));

describe("StatusController", () => {
	let req, res;

	beforeEach(() => {
		req = {};
		res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		};
		jest.clearAllMocks();
		process.env.API_NAME = "TestAPI";
		process.env.API_ENVIRONMENT = "test";
		process.env.API_VERSION = "1.0.0";
		process.env.SERVER_BASE_URL = "https://server.com";
		process.env.SERVER_NAME = "TestServer";
		process.env.SERVER_ENVIRONMENT = "production";
		process.env.SERVER_VERSION = "2.0.0";
	});

	describe("getStatusApi", () => {
		it("should return API status (happy path)", async () => {
			// Act
			await StatusController.getStatusApi(req, res);

			// Assert
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "API status 🚀",
					name: "TestAPI",
					environment: "test",
					version: "1.0.0",
					uptime: expect.any(Number),
					hash: "mocked-uuid",
				})
			);
		});

		it("should handle error in getStatusApi (error case)", async () => {
			// Arrange
			const originalDate = global.Date;
			global.Date = class {
				static getTime() {
					throw new Error("Date error");
				}
			};
			const oldGetTime = Date.prototype.getTime;
			Date.prototype.getTime = () => {
				throw new Error("Date error");
			};

			// Act
			await StatusController.getStatusApi(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Unable to request API status",
				details: expect.stringContaining("Error"),
			});

			// Arrange
			Date.prototype.getTime = oldGetTime;
			global.Date = originalDate;
		});
	});

	describe("getStatusServer", () => {
		it("should return server status (happy path)", async () => {
			// Arrange
			const mockResponse = {
				status: 200,
				statusText: "OK",
			};
			axios.get.mockResolvedValue(mockResponse);

			// Act
			await StatusController.getStatusServer(req, res);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				"https://server.com/b/Electronics/bn_7000259124"
			);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Server status 🚀",
					name: "TestServer",
					environment: "production",
					version: "2.0.0",
					status: "200",
					status_text: "OK",
					uptime: expect.any(Number),
					hash: "mocked-uuid",
				})
			);
		});

		it("should handle error from axios (error case)", async () => {
			// Arrange
			axios.get.mockRejectedValue(new Error("Network error"));

			// Act
			await StatusController.getStatusServer(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(503);
			expect(res.json).toHaveBeenCalledWith({
				error: "Unable to request server status",
				details: expect.stringContaining("Network error"),
			});
		});

		it("should handle edge case: missing SERVER_BASE_URL", async () => {
			// Arrange
			process.env.SERVER_BASE_URL = "";
			axios.get.mockResolvedValue({ status: 200, statusText: "OK" });

			// Act
			await StatusController.getStatusServer(req, res);

			// Assert
			expect(axios.get).toHaveBeenCalledWith(
				"/b/Electronics/bn_7000259124"
			);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "200",
					status_text: "OK",
				})
			);
		});

		it("should handle edge case: axios resolves with undefined status/statusText", async () => {
			// Arrange
			axios.get.mockResolvedValue({});

			// Act
			await StatusController.getStatusServer(req, res);

			// Assert
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "undefined",
					status_text: "undefined",
				})
			);
		});
	});
});
