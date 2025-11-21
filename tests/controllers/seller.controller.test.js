// __tests__/controllers/seller.controller.test.js

import SellersController from "../../controllers/seller.controller.js";
import axios from "axios";
import { validateApiKey } from "../../utils/auth.js";

jest.mock("cheerio", () => ({
	load: jest.fn(),
}));
import cheerio from "cheerio";

jest.mock("axios");
jest.mock("../../utils/auth.js");

const SERVER = "https://www.ebay.com";
const MINIMUM_OF_LETTERS = 2;

// Patch globals for the controller
global.SERVER = SERVER;
global.MINIMUM_OF_LETTERS = MINIMUM_OF_LETTERS;

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

describe("SellersController.getSellerProducts", () => {
	let req, res;

	beforeEach(() => {
		req = {
			query: {},
			headers: { "x-api-key": "encoded-key" },
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		jest.clearAllMocks();
	});

	it("should return products array (happy path)", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		req.query = { seller_name: "teststore", page: "3" };

		const fakeHtml =
			'<li class="s-item s-item__pl-on-bottom"></li><li class="s-item s-item__pl-on-bottom"></li>';
		const fakeProducts = [
			makeElementMock({
				"div.s-item__title": { text: "Product 1" },
				"div.s-item__subtitle > span.SECONDARY_INFO": { text: "New" },
				"span.s-item__price": { text: "$10.00" },
				"span.s-item__location.s-item__itemLocation": { text: "USA" },
				"span.s-item__shipping.s-item__logisticsCost": {
					text: "$5.00",
				},
				"a.s-item__link": {
					attr: "https://www.ebay.com/itm/12345?param=1",
				},
				"div.s-item__image-wrapper > img": {
					attr: "https://img.ebay.com/1.jpg",
				},
			}),
			makeElementMock({
				"div.s-item__title": { text: "Product 2" },
				"div.s-item__subtitle > span.SECONDARY_INFO": { text: "Used" },
				"span.s-item__price": { text: "$20.00" },
				"span.s-item__location.s-item__itemLocation": { text: "UK" },
				"span.s-item__shipping.s-item__logisticsCost": {
					text: "$10.00",
				},
				"a.s-item__link": {
					attr: "https://www.ebay.com/itm/67890?param=2",
				},
				"div.s-item__image-wrapper > img": {
					attr: "https://img.ebay.com/2.jpg",
				},
			}),
		];
		const products = {
			each: (cb) => fakeProducts.forEach((el, i) => cb(i, el)),
		};
		const $ = jest.fn((selector) => {
			if (selector === "li.s-item.s-item__pl-on-bottom") return products;
			if (fakeProducts.includes(selector)) return selector;
			return {};
		});
		cheerio.load.mockReturnValue($);

		axios.get.mockResolvedValue({ data: fakeHtml });

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(validateApiKey).toHaveBeenCalledWith("encoded-key");
		expect(axios.get).toHaveBeenCalledWith(
			"https://www.ebay.com/sch/i.html?_dkr=1&iconV2Request=true&_blrs=recall_filtering&_ssn=teststore&store_name=teststore&_oac=1&_pgn=3&rt=nc&_ipg=240"
		);
		expect(res.json).toHaveBeenCalledWith(expect.any(Array));
	});

	it("should use default page number if not provided", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		req.query = { seller_name: "store" };

		const products = { each: jest.fn() };
		const $ = jest.fn((selector) => {
			if (selector === "li.s-item.s-item__pl-on-bottom") return products;
			return {};
		});
		cheerio.load.mockReturnValue($);
		axios.get.mockResolvedValue({ data: "" });

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(axios.get).toHaveBeenCalledWith(
			expect.stringContaining("_pgn=1")
		);
		expect(res.json).toHaveBeenCalledWith(expect.any(Array));
	});

	it("should return 412 if seller_name is too short", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		req.query = { seller_name: "a" };

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(412);
		expect(res.json).toHaveBeenCalledWith({
			error: "[412] Precondition failed",
			details: "Provide a seller name",
		});
	});

	it("should return 412 if API key is invalid", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => {
			throw new Error("Invalid Ebay Scraper API_KEY");
		});
		req.query = { seller_name: "store" };

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(412);
		expect(res.json).toHaveBeenCalledWith({
			error: "[412] Precondition failed",
			details: "Invalid Ebay Scraper API_KEY",
		});
	});

	it("should return 500 if axios throws an error", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		req.query = { seller_name: "store" };
		axios.get.mockRejectedValue(new Error("Network error"));

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to search seller products on server",
			details: "Network error",
		});
	});

	it("should handle missing x-api-key header", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => {
			throw new Error("Missing x-api-key header");
		});
		req.headers = {};

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(412);
		expect(res.json).toHaveBeenCalledWith({
			error: "[412] Precondition failed",
			details: "Missing x-api-key header",
		});
	});

	it("should handle missing seller_name in query", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		req.query = {};

		// Act
		await SellersController.getSellerProducts(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to search seller products on server",
			details:
				"Cannot read properties of undefined (reading 'toLowerCase')",
		});
	});
});
