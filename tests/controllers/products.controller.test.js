// __tests__/controllers/products.controller.test.js

import ProductsController from "../../controllers/products.controller.js";
import axios from "axios";
import { validateApiKey } from "../../utils/auth.js";
import pLimit from "p-limit";

jest.mock("cheerio", () => ({
	load: jest.fn(),
}));
import cheerio from "cheerio";

jest.mock("axios");
jest.mock("../../utils/auth.js");
jest.mock("p-limit", () => jest.fn(() => (fn) => fn()));

const SERVER = "https://www.ebay.com";
const MINIMUM_OF_LETTERS = 2;
const subdomainsMap = {
	us: "https://www.ebay.com",
	usa: "https://www.ebay.com",
	france: "https://www.ebay.fr",
	germany: "https://www.ebay.de",
};

global.SERVER = SERVER;
global.MINIMUM_OF_LETTERS = MINIMUM_OF_LETTERS;
global.subdomainsMap = subdomainsMap;

// Utilitário para criar mocks de elementos Cheerio
function makeElementMock(data) {
	return {
		find: jest.fn((selector) => {
			const val = data[selector] || {};
			return {
				text: () => val.text ?? "",
				attr: () => val.attr ?? undefined,
			};
		}),
	};
}

describe("ProductsController", () => {
	let req, res;

	beforeEach(() => {
		req = {
			headers: { "x-api-key": "encoded-key" },
			query: {},
			params: {},
		};
		res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		};
		jest.clearAllMocks();
	});

	describe("getProducts", () => {
		// TODO: "should return products array (happy path)"
		// TODO: "should handle axios error"
		it("should return 400 if product_name is not a string", async () => {
			// Arrange
			validateApiKey.mockImplementation(() => true);
			req.query = { product_name: 123 };

			// Act
			await ProductsController.getProducts(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid product name",
				details: "Product name must be a string",
			});
		});

		it("should return 412 if product_name is too short", async () => {
			// Arrange
			validateApiKey.mockImplementation(() => true);
			req.query = { product_name: "a" };

			// Act
			await ProductsController.getProducts(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(412);
			expect(res.json).toHaveBeenCalledWith({
				error: "[412] Precondition failed",
				details: "Provide a product name",
			});
		});

		it("should handle invalid API key", async () => {
			// Arrange
			validateApiKey.mockImplementation(() => {
				throw new Error("Invalid Ebay Scraper API_KEY");
			});
			req.query = { product_name: "laptop" };

			// Act
			await ProductsController.getProducts(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(412);
			expect(res.json).toHaveBeenCalledWith({
				error: "[412] Precondition failed",
				details: "Invalid Ebay Scraper API_KEY",
			});
		});
	});

	describe("getProductById", () => {
		// TODO: "should return product info when found in requested domain (happy path)"
		// TODO: "should return product info when found in another domain"

		it("should return 404 if product not found in any domain", async () => {
			// Arrange
			validateApiKey.mockImplementation(() => true);
			req.params = { id: "99999" };
			req.query = { country: "us" };
			const $ = jest.fn();
			cheerio.load.mockReturnValue($);
			$.mockReturnValue({ length: 0 });
			global.extractProductInfo = jest.fn(() => []);
			axios.get.mockRejectedValue(new Error("Not found"));

			// Act
			await ProductsController.getProductById(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "[404] Not found",
					details: expect.stringContaining(
						"was not found in any supported eBay subdomain"
					),
					lastError: expect.anything(),
				})
			);
		});

		it("should handle invalid API key", async () => {
			// Arrange
			validateApiKey.mockImplementation(() => {
				throw new Error("Invalid Ebay Scraper API_KEY");
			});
			req.params = { id: "12345" };
			req.query = { country: "us" };

			// Act
			await ProductsController.getProductById(req, res);

			// Assert
			expect(res.status).toHaveBeenCalledWith(412);
			expect(res.json).toHaveBeenCalledWith({
				error: "[412] Precondition failed",
				details: "Invalid Ebay Scraper API_KEY",
			});
		});
	});
});
