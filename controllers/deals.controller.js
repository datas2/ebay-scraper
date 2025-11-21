import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

import { validateApiKey } from "../utils/auth.js";

// Define .env config
dotenv.config();
const { API_KEY } = process.env;

export default class DealsController {
	static async getFeaturedDeals(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

			const link = `https://www.ebay.com/globaldeals`;
			let response;
			try {
				response = await axios.get(link, { signal: controller.signal });
			} catch (err) {
				if (err.name === "AbortError") {
					console.warn(
						`Aborted request detected: ${req.method} ${req.originalUrl}`
					);
					return; // Request was aborted due to timeout or client disconnect
				}
				throw err;
			}
			const html = response.data;
			const $ = cheerio.load(html);
			const deal = $("div.col");

			let deals = [];

			deal.each((index, element) => {
				const name = $(element)
					.find("h3.dne-itemtile-title.ellipse-2")
					.attr("title");

				let aux = $(element).find("span.first").text().trim();
				aux = aux.split("$");
				const price = aux.length >= 2 ? aux[1] : aux[0];

				aux = $(element)
					.find("span.itemtile-price-strikethrough")
					.text()
					.trim();
				aux = aux.split("$");
				const original_price = aux.length >= 2 ? aux[1] : aux[0];

				// if possible, calculate the discount
				let discount = 0;
				if (original_price !== "" && price !== "") {
					discount = (
						(parseFloat(price) * 100) / parseFloat(original_price) -
						100
					).toFixed(2);
					aux = "";
					discount = aux.concat(discount, "%");
				}

				const currency = $(element)
					.find("div.dne-itemtile-price > meta")
					.attr("content");

				const product_condition = $(element)
					.find("span.dne-itemcard-badge-text")
					.text()
					.trim();

				const sale_status = $(element)
					.find("span.dne-itemcard-hotness.itemcard-hotness-red ")
					.text()
					.trim();

				const link = $(element)
					.find("div.dne-itemtile-detail > a")
					.attr("href");

				const image = $(element)
					.find("div.slashui-image-cntr > img")
					.attr("src");

				deals.push({
					product_name: name,
					price:
						price.length > 0
							? price.replaceAll(" ", "")
							: "uninformed",
					original_price:
						original_price.length > 0
							? original_price.replaceAll(" ", "")
							: null,
					currency: currency,
					discount: discount,
					product_condition:
						product_condition.length > 0 ? product_condition : null,
					sale_status: sale_status.length > 0 ? sale_status : null,
					link: link,
					image: image,
				});
			});
			res.json(deals);
		} catch (err) {
			const status =
				err.message.includes("API_KEY") ||
				err.message.includes("x-api-key")
					? 412
					: 500;
			res.status(status).json({
				error:
					status === 412
						? "[412] Precondition failed"
						: "Unable to get featured deals on server",
				details: `${err.message}`,
			});
		}
	}

	static async getTechDeals(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

			const link = `https://www.ebay.com/globaldeals/tech`;
			let response;
			try {
				response = await axios.get(link, { signal: controller.signal });
			} catch (err) {
				console.warn(
					`Aborted request detected: ${req.method} ${req.originalUrl}`
				);
				if (err.name === "AbortError") {
					return;
				}
				throw err;
			}
			const html = response.data;
			const $ = cheerio.load(html);
			const deal = $("div.col");

			let deals = [];

			deal.each((index, element) => {
				const name = $(element)
					.find("h3.dne-itemtile-title.ellipse-2")
					.attr("title");

				let aux = $(element).find("span.first").text().trim();
				aux = aux.split("$");
				const price = aux.length >= 2 ? aux[1] : aux[0];

				aux = $(element)
					.find("span.itemtile-price-strikethrough")
					.text()
					.trim();
				aux = aux.split("$");
				const original_price = aux.length >= 2 ? aux[1] : aux[0];

				// if possible, calculate the discount
				let discount = 0;
				if (original_price !== "" && price !== "") {
					discount = (
						(parseFloat(price) * 100) / parseFloat(original_price) -
						100
					).toFixed(2);
					aux = "";
					discount = aux.concat(discount, "%");
				}

				const currency = $(element)
					.find("div.dne-itemtile-price > meta")
					.attr("content");

				const product_condition = $(element)
					.find("span.dne-itemcard-badge-text")
					.text()
					.trim();

				const sale_status = $(element)
					.find("span.dne-itemcard-hotness.itemcard-hotness-red ")
					.text()
					.trim();

				const link = $(element)
					.find("div.dne-itemtile-detail > a")
					.attr("href");

				const image = $(element)
					.find("div.slashui-image-cntr > img")
					.attr("src");

				deals.push({
					product_name: name,
					price:
						price.length > 0
							? price.replaceAll(" ", "")
							: "uninformed",
					original_price:
						original_price.length > 0
							? original_price.replaceAll(" ", "")
							: null,
					currency: currency,
					discount: discount,
					product_condition:
						product_condition.length > 0 ? product_condition : null,
					sale_status: sale_status.length > 0 ? sale_status : null,
					link: link,
					image: image,
				});
			});
			res.json(deals);
		} catch (err) {
			const status =
				err.message.includes("API_KEY") ||
				err.message.includes("x-api-key")
					? 412
					: 500;
			res.status(status).json({
				error:
					status === 412
						? "[412] Precondition failed"
						: "Unable to get featured deals on server",
				details: `${err.message}`,
			});
		}
	}

	static async getFashionDeals(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

			const link = `https://www.ebay.com/globaldeals/fashion`;
			let response;
			try {
				response = await axios.get(link, { signal: controller.signal });
			} catch (err) {
				if (err.name === "AbortError") {
					console.warn(
						`Aborted request detected: ${req.method} ${req.originalUrl}`
					);
					return;
				}
				throw err;
			}
			const html = response.data;
			const $ = cheerio.load(html);
			const deal = $("div.col");

			let deals = [];

			deal.each((index, element) => {
				const name = $(element)
					.find("h3.dne-itemtile-title.ellipse-2")
					.attr("title");

				let aux = $(element).find("span.first").text().trim();
				aux = aux.split("$");
				const price = aux.length >= 2 ? aux[1] : aux[0];

				aux = $(element)
					.find("span.itemtile-price-strikethrough")
					.text()
					.trim();
				aux = aux.split("$");
				const original_price = aux.length >= 2 ? aux[1] : aux[0];

				// if possible, calculate the discount
				let discount = 0;
				if (original_price !== "" && price !== "") {
					discount = (
						(parseFloat(price) * 100) / parseFloat(original_price) -
						100
					).toFixed(2);
					aux = "";
					discount = aux.concat(discount, "%");
				}

				const currency = $(element)
					.find("div.dne-itemtile-price > meta")
					.attr("content");

				const product_condition = $(element)
					.find("span.dne-itemcard-badge-text")
					.text()
					.trim();

				const sale_status = $(element)
					.find("span.dne-itemcard-hotness.itemcard-hotness-red ")
					.text()
					.trim();

				const link = $(element)
					.find("div.dne-itemtile-detail > a")
					.attr("href");

				const image = $(element)
					.find("div.slashui-image-cntr > img")
					.attr("src");

				deals.push({
					product_name: name,
					price:
						price.length > 0
							? price.replaceAll(" ", "")
							: "uninformed",
					original_price:
						original_price.length > 0
							? original_price.replaceAll(" ", "")
							: null,
					currency: currency,
					discount: discount,
					product_condition:
						product_condition.length > 0 ? product_condition : null,
					sale_status: sale_status.length > 0 ? sale_status : null,
					link: link,
					image: image,
				});
			});
			res.json(deals);
		} catch (err) {
			const status =
				err.message.includes("API_KEY") ||
				err.message.includes("x-api-key")
					? 412
					: 500;
			res.status(status).json({
				error:
					status === 412
						? "[412] Precondition failed"
						: "Unable to get featured deals on server",
				details: `${err.message}`,
			});
		}
	}

	static async getHomeDeals(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

			const link = `https://www.ebay.com/globaldeals/home`;
			let response;
			try {
				response = await axios.get(link, { signal: controller.signal });
			} catch (err) {
				if (err.name === "AbortError") {
					console.warn(
						`Aborted request detected: ${req.method} ${req.originalUrl}`
					);
					return;
				}
				throw err;
			}
			const html = response.data;
			const $ = cheerio.load(html);
			const deal = $("div.col");

			let deals = [];

			deal.each((index, element) => {
				const name = $(element)
					.find("h3.dne-itemtile-title.ellipse-2")
					.attr("title");

				let aux = $(element).find("span.first").text().trim();
				aux = aux.split("$");
				const price = aux.length >= 2 ? aux[1] : aux[0];

				aux = $(element)
					.find("span.itemtile-price-strikethrough")
					.text()
					.trim();
				aux = aux.split("$");
				const original_price = aux.length >= 2 ? aux[1] : aux[0];

				// if possible, calculate the discount
				let discount = 0;
				if (original_price !== "" && price !== "") {
					discount = (
						(parseFloat(price) * 100) / parseFloat(original_price) -
						100
					).toFixed(2);
					aux = "";
					discount = aux.concat(discount, "%");
				}

				const currency = $(element)
					.find("div.dne-itemtile-price > meta")
					.attr("content");

				const product_condition = $(element)
					.find("span.dne-itemcard-badge-text")
					.text()
					.trim();

				const sale_status = $(element)
					.find("span.dne-itemcard-hotness.itemcard-hotness-red ")
					.text()
					.trim();

				const link = $(element)
					.find("div.dne-itemtile-detail > a")
					.attr("href");

				const image = $(element)
					.find("div.slashui-image-cntr > img")
					.attr("src");

				deals.push({
					product_name: name,
					price:
						price.length > 0
							? price.replaceAll(" ", "")
							: "uninformed",
					original_price:
						original_price.length > 0
							? original_price.replaceAll(" ", "")
							: null,
					currency: currency,
					discount: discount,
					product_condition:
						product_condition.length > 0 ? product_condition : null,
					sale_status: sale_status.length > 0 ? sale_status : null,
					link: link,
					image: image,
				});
			});
			res.json(deals);
		} catch (err) {
			const status =
				err.message.includes("API_KEY") ||
				err.message.includes("x-api-key")
					? 412
					: 500;
			res.status(status).json({
				error:
					status === 412
						? "[412] Precondition failed"
						: "Unable to get featured deals on server",
				details: `${err.message}`,
			});
		}
	}
}
