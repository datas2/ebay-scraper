// __tests__/controllers/deals.controller.test.js

import DealsController from "../../controllers/deals.controller.js";
import axios from "axios";
import { validateApiKey } from "../../utils/auth.js";

jest.mock("cheerio", () => ({
	load: jest.fn(),
}));
import cheerio from "cheerio";

jest.mock("axios");
jest.mock("../../utils/auth.js");

describe("DealsController", () => {
	let req, res, $mock, dealMock;

	beforeEach(() => {
		req = { headers: { "x-api-key": "encoded-key" } };
		res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		};
		jest.clearAllMocks();

		// Mock cheerio and deal.each
		$mock = jest.fn();
		dealMock = {
			each: jest.fn(),
		};
		cheerio.load.mockReturnValue($mock);
		$mock.mockReturnValue(dealMock);
	});

	const dealElementMock = (opts = {}) => ({
		find: jest.fn((selector) => ({
			text: jest.fn(() => opts[selector]?.text ?? ""),
			attr: jest.fn(() => opts[selector]?.attr ?? ""),
		})),
	});

	const runHappyPath = async (method, url) => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		const html = "<div></div>";
		axios.get.mockResolvedValue({ data: html });

		const elements = [
			dealElementMock({
				"h3.dne-itemtile-title.ellipse-2": {
					text: "Product 1",
					attr: "Product 1",
				},
				"span.first": { text: "$10.00", attr: "$10.00" },
				"span.itemtile-price-strikethrough": {
					text: "$20.00",
					attr: "$20.00",
				},
				"div.dne-itemtile-price > meta": { text: "", attr: "USD" },
				"span.dne-itemcard-badge-text": { text: "New", attr: "New" },
				"span.dne-itemcard-hotness.itemcard-hotness-red ": {
					text: "Hot",
					attr: "Hot",
				},
				"div.dne-itemtile-detail > a": {
					text: "",
					attr: "https://ebay.com/p1",
				},
				"div.slashui-image-cntr > img": {
					text: "",
					attr: "https://img.com/1.jpg",
				},
			}),
			dealElementMock({
				"h3.dne-itemtile-title.ellipse-2": {
					text: "Product 2",
					attr: "Product 2",
				},
				"span.first": { text: "$5.00", attr: "$5.00" },
				"span.itemtile-price-strikethrough": {
					text: "$10.00",
					attr: "$10.00",
				},
				"div.dne-itemtile-price > meta": { text: "", attr: "EUR" },
				"span.dne-itemcard-badge-text": { text: "", attr: "" },
				"span.dne-itemcard-hotness.itemcard-hotness-red ": {
					text: "",
					attr: "",
				},
				"div.dne-itemtile-detail > a": {
					text: "",
					attr: "https://ebay.com/p2",
				},
				"div.slashui-image-cntr > img": {
					text: "",
					attr: "https://img.com/2.jpg",
				},
			}),
		];

		const $ = jest.fn((arg) => {
			if (arg === "div.col") {
				return {
					each: (cb) => elements.forEach((el, i) => cb(i, el)),
				};
			}
			if (elements.includes(arg)) {
				return arg;
			}
			return {};
		});
		cheerio.load.mockReturnValue($);

		// dealMock.each.mockImplementation((cb) =>
		// 	elements.forEach((el, i) => cb(i, el))
		// );

		// Act
		await DealsController[method](req, res);

		// Assert
		expect(validateApiKey).toHaveBeenCalledWith("encoded-key");
		expect(axios.get).toHaveBeenCalledWith(url);
		expect(res.json).toHaveBeenCalledWith([
			{
				product_name: "Product 1",
				price: "10.00",
				original_price: "20.00",
				currency: "USD",
				discount: "-50.00%",
				product_condition: "New",
				sale_status: "Hot",
				link: "https://ebay.com/p1",
				image: "https://img.com/1.jpg",
			},
			{
				product_name: "Product 2",
				price: "5.00",
				original_price: "10.00",
				currency: "EUR",
				discount: "-50.00%",
				product_condition: null,
				sale_status: null,
				link: "https://ebay.com/p2",
				image: "https://img.com/2.jpg",
			},
		]);
	};

	// TODO: "should handle edge case: price and original_price empty"
	it("getFeaturedDeals - happy path", async () => {
		// Act & Assert
		await runHappyPath(
			"getFeaturedDeals",
			"https://www.ebay.com/globaldeals"
		);
	});

	it("getTechDeals - happy path", async () => {
		// Act & Assert
		await runHappyPath(
			"getTechDeals",
			"https://www.ebay.com/globaldeals/tech"
		);
	});

	it("getFashionDeals - happy path", async () => {
		// Act & Assert
		await runHappyPath(
			"getFashionDeals",
			"https://www.ebay.com/globaldeals/fashion"
		);
	});

	it("getHomeDeals - happy path", async () => {
		// Act & Assert
		await runHappyPath(
			"getHomeDeals",
			"https://www.ebay.com/globaldeals/home"
		);
	});

	it("should handle empty deals (edge case)", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		axios.get.mockResolvedValue({ data: "<div></div>" });
		dealMock.each.mockImplementation((cb) => {});

		// Act
		await DealsController.getFeaturedDeals(req, res);

		// Assert
		expect(res.json).toHaveBeenCalledWith([]);
	});

	it("should handle missing x-api-key header (error case)", async () => {
		// Arrange
		req.headers = {};
		validateApiKey.mockImplementation(() => {
			throw new Error("Missing x-api-key header");
		});

		// Act
		await DealsController.getFeaturedDeals(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(412);
		expect(res.json).toHaveBeenCalledWith({
			error: "[412] Precondition failed",
			details: "Missing x-api-key header",
		});
	});

	it("should handle invalid API key (error case)", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => {
			throw new Error("Invalid Ebay Scraper API_KEY");
		});

		// Act
		await DealsController.getFeaturedDeals(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(412);
		expect(res.json).toHaveBeenCalledWith({
			error: "[412] Precondition failed",
			details: "Invalid Ebay Scraper API_KEY",
		});
	});

	it("should handle axios error (error case)", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		axios.get.mockRejectedValue(new Error("Network error"));

		// Act
		await DealsController.getFeaturedDeals(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to get featured deals on server",
			details: "Network error",
		});
	});

	it("should handle cheerio.load throwing error (error case)", async () => {
		// Arrange
		validateApiKey.mockImplementation(() => true);
		axios.get.mockResolvedValue({ data: "<div></div>" });
		cheerio.load.mockImplementation(() => {
			throw new Error("Cheerio error");
		});

		// Act
		await DealsController.getFeaturedDeals(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to get featured deals on server",
			details: "Cheerio error",
		});
	});
});
