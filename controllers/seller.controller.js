import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { validateApiKey } from "../utils/auth.js";

// Define .env config
dotenv.config();
const SERVER = process.env.SERVER_BASE_URL;
const MINIMUM_OF_LETTERS = 2;

export default class SellersController {
	static async getSellerProducts(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const page_number = req.query.page || 1;
			const seller_name = req.query.seller_name.toLowerCase();

			let domain = SERVER;

			const link = `https://www.ebay.com/sch/i.html?_ssn=${seller_name}&store_name=${seller_name}&_oac=1&_pgn=${page_number}&rt=nc&_ipg=240`;
			if (seller_name.length < MINIMUM_OF_LETTERS) {
				return res.status(412).json({
					error: "[412] Precondition failed",
					details: "Provide a seller name",
				});
			}

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

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
			const products = $("li.s-card.s-card--horizontal");
			const ebay_products = [];

			products.each((index, element) => {
				const getText = (selector) =>
					$(element).find(selector).text().trim();
				const getAttr = (selector, attr) =>
					$(element).find(selector).attr(attr);

				// Product ID
				const url = getAttr("a.su-link, a.image-treatment", "href");
				let id;
				if (url) {
					const match = url.match(/\/itm\/(\d+)/);
					id = match ? match[1] : undefined;
				} else {
					id =
						$(element).attr("data-listingid") ||
						$(element).attr("id");
				}

				// Product Name
				const name =
					getText(
						"div.s-card__title > span.su-styled-text.primary.default"
					) || product_name;

				// Condition (first span in .s-card__subtitle)
				const condition = $(element)
					.find(
						"div.s-card__subtitle > span.su-styled-text.secondary.default"
					)
					.first()
					.text()
					.replace("·", "")
					.trim();

				// Price
				const price = getText(
					"span.su-styled-text.primary.bold.large-1.s-card__price"
				);

				// Discount (span com classe positive bold large ou badge)
				const discount =
					$(element)
						.find(
							"span.su-styled-text.positive.bold.large, span.s-card__badge"
						)
						.text()
						.trim() || "uninformed";

				// Product location (span secundário na subtitle ou badge de localização)
				const product_location =
					$(element)
						.find(
							"div.s-card__subtitle > span.su-styled-text.secondary.default"
						)
						.eq(1)
						.text()
						.trim() ||
					$(element)
						.find("span.s-card__badge--location")
						.text()
						.trim() ||
					"uninformed";

				// Logistics cost (procura por "delivery" ou "shipping" nas linhas secundárias)
				let logistics_cost = "";
				$(element)
					.find(
						"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.secondary.large"
					)
					.each((_, el) => {
						const txt = $(el).text().trim();
						if (
							txt.toLowerCase().includes("delivery") ||
							txt.toLowerCase().includes("shipping")
						) {
							logistics_cost = txt;
						}
					});
				if (!logistics_cost) logistics_cost = "uninformed";

				// Sales potential (procura por "watchers", "hot", "trending" etc)
				let sales_potential = "";
				$(element)
					.find(
						"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.primary.bold.large"
					)
					.each((_, el) => {
						const txt = $(el).text().trim();
						if (
							txt.toLowerCase().includes("watcher") ||
							txt.toLowerCase().includes("hot") ||
							txt.toLowerCase().includes("trending")
						) {
							sales_potential = txt;
						}
					});
				if (!sales_potential) sales_potential = "uninformed";

				// Description (all subtitle-row text)
				const description = getText("div.s-card__subtitle-row");

				// Image
				const thumbnail = getAttr("img.s-card__image", "src");

				ebay_products.push({
					product_id: id,
					name: name,
					condition: condition,
					price: price,
					discount: discount,
					product_location: product_location,
					logistics_cost: logistics_cost,
					description: description,
					sales_potential: sales_potential,
					link: url,
					thumbnail: thumbnail,
				});
			});

			$.root().empty();
			res.json(ebay_products);
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
						: "Unable to search seller products on server",
				details: `${err.message}`,
			});
		}
	}
}
