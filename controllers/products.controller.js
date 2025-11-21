import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import dotenv from "dotenv";

import { validateApiKey } from "../utils/auth.js";

// Define .env config
dotenv.config();

// Configure automatic retry for Axios:
// - 3 attempts
// - Retry on network errors, timeout, 5xx and 429
// - Exponential backoff
axiosRetry(axios, {
	retries: 3,
	retryDelay: axiosRetry.exponentialDelay,
	retryCondition: (error) => {
		// Retry on network errors, timeout, 5xx and 429
		return (
			axiosRetry.isNetworkOrIdempotentRequestError(error) ||
			(error.response &&
				(error.response.status >= 500 || error.response.status === 429))
		);
	},
	onRetry: (retryCount, error, requestConfig) => {
		const url = requestConfig?.url || requestConfig;
		const status = error?.response?.status || "NO_STATUS";
		console.warn(
			`[axios-retry] Retry #${retryCount} for ${url} (status: ${status}) - error: ${error.message}`
		);
	},
});

// Define .env config
const SERVER = process.env.SERVER_BASE_URL;
const { API_KEY } = process.env;
const MINIMUM_OF_LETTERS = 2;

// Limit the number of concurrent requests to avoid overwhelming the server
const CONCURRENCY_LIMIT = 10;
const limit = pLimit(CONCURRENCY_LIMIT);

// Define ebay subdomains
const subdomainsMap = {
	us: "https://www.ebay.com",
	usa: "https://www.ebay.com",
	philippines: "https://www.ebay.ph",
	australia: "https://www.ebay.com.au",
	austria: "https://www.ebay.at",
	canada: "https://www.ebay.ca",
	france: "https://www.ebay.fr",
	germany: "https://www.ebay.de",
	"hong kong": "https://www.ebay.com.hk",
	ireland: "https://www.ebay.ie",
	italy: "https://www.ebay.it",
	malaysia: "https://www.ebay.com.my",
	netherlands: "https://www.ebay.nl",
	poland: "https://www.ebay.pl",
	singapore: "https://www.ebay.com.sg",
	spain: "https://www.ebay.es",
	switzerland: "https://www.ebay.ch",
	uk: "https://www.ebay.co.uk",
};

function extractProductListHorizontal($, product_name) {
	const products = $(
		"li.s-card.s-card--horizontal.s-card--dark-solt-links-blue"
	);
	const ebay_products = [];

	products.each((_, element) => {
		const getText = (selector) => $(element).find(selector).text().trim();
		const getAttr = (selector, attr) =>
			$(element).find(selector).attr(attr);

		// Product ID
		const url = getAttr("a.su-link, a.image-treatment", "href");
		let id;
		if (url) {
			const match = url.match(/\/itm\/(\d+)/);
			id = match ? match[1] : undefined;
		} else {
			id = $(element).attr("data-listingid") || $(element).attr("id");
		}

		// Product Name
		const name =
			getText(
				"div.s-card__title > span.su-styled-text.primary.default"
			) || product_name;

		// Condition (first span in .s-card__subtitle)
		const condition =
			getText(
				"div.s-card__subtitle > span.su-styled-text.secondary.default"
			) || "uninformed";

		// Price
		const price =
			getText("span.su-styled-text.primary.bold.large-1.s-card__price") ||
			"uninformed";

		// Discount (ex: 72% off)
		let discount = "uninformed";
		$(element)
			.find(
				"span.su-styled-text.secondary.bold.large, span.su-styled-text.positive.bold.large"
			)
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/%\s*off/i.test(txt)) {
					discount = txt;
					return false; // break loop
				}
			});

		// Product location (ex: from New Stanton, PA)
		let product_location = "uninformed";
		$(element)
			.find("span.su-styled-text.secondary.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/^from /i.test(txt)) {
					product_location = txt.replace(/^from /i, "");
				}
			});

		// Logistics cost (procura por "delivery" ou "shipping" nas linhas secundárias)
		// (ex: +R$ 21.51 shipping)
		let logistics_cost = "uninformed";
		$(element)
			.find("span.su-styled-text.secondary.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/shipping|delivery/i.test(txt) && /^[+]/.test(txt)) {
					logistics_cost = txt;
				}
			});

		// Sales potential (procura por "watchers", "hot", "trending" etc)
		// Sales potential (ex: 70 sold)
		let sales_potential = "uninformed";
		$(element)
			.find("span.su-styled-text.primary.bold.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/sold|watcher|hot|trending/i.test(txt)) {
					sales_potential = txt;
				}
			});

		// Description (all subtitle-row text)
		const description = getText("div.s-card__subtitle-row");

		// Seller name and feedback (from attributes secondary)
		const seller_name = $(element)
			.find(
				"div.su-card-container__attributes__secondary .s-card__attribute-row .su-styled-text.primary.large"
			)
			.first()
			.text()
			.trim();
		const seller_feedback = $(element)
			.find(
				"div.su-card-container__attributes__secondary .s-card__attribute-row .su-styled-text.primary.large"
			)
			.eq(1)
			.text()
			.trim();

		// Watchers (optional)
		const watchers = $(element)
			.find(
				"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.primary.bold.large"
			)
			.text()
			.trim();

		// Delivery info (optional)
		const delivery = $(element)
			.find(
				"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.secondary.large"
			)
			.first()
			.text()
			.trim();

		// Image
		const thumbnail =
			$(element).find("img.s-card__image").attr("src") || "";

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
			seller_name: seller_name,
			seller_feedback: seller_feedback,
			watchers: watchers,
			delivery: delivery,
			link: url,
			thumbnail: thumbnail,
		});
	});

	$.root().empty();
	return ebay_products;
}

function extractProductListVertical($, product_name) {
	const products = $(
		"li.s-card.s-card--vertical.s-card--dark-solt-links-blue"
	);
	const ebay_products = [];

	products.each((_, element) => {
		const getText = (selector) => $(element).find(selector).text().trim();
		const getAttr = (selector, attr) =>
			$(element).find(selector).attr(attr);

		// Product ID
		const url = getAttr("a.su-link, a.image-treatment", "href");
		let id;
		if (url) {
			const match = url.match(/\/itm\/(\d+)/);
			id = match ? match[1] : undefined;
		} else {
			id = $(element).attr("data-listingid") || $(element).attr("id");
		}

		// Product Name
		const name =
			getText(
				"div.s-card__title > span.su-styled-text.primary.default"
			) || product_name;

		// Condition (first span in .s-card__subtitle)
		const condition =
			getText(
				"div.s-card__subtitle > span.su-styled-text.secondary.default"
			) || "uninformed";

		// Price
		const price =
			getText("span.su-styled-text.primary.bold.large-1.s-card__price") ||
			"uninformed";

		// Discount (ex: 72% off)
		let discount = "uninformed";
		$(element)
			.find(
				"span.su-styled-text.secondary.bold.large, span.su-styled-text.positive.bold.large"
			)
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/%\s*off/i.test(txt)) {
					discount = txt;
					return false; // break loop
				}
			});

		// Product location (ex: from New Stanton, PA)
		let product_location = "uninformed";
		$(element)
			.find("span.su-styled-text.secondary.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/^from /i.test(txt)) {
					product_location = txt.replace(/^from /i, "");
				}
			});

		// Logistics cost (procura por "delivery" ou "shipping" nas linhas secundárias)
		// (ex: +R$ 21.51 shipping)
		let logistics_cost = "uninformed";
		$(element)
			.find("span.su-styled-text.secondary.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/shipping|delivery/i.test(txt) && /^[+]/.test(txt)) {
					logistics_cost = txt;
				}
			});

		// Sales potential (procura por "watchers", "hot", "trending" etc)
		// Sales potential (ex: 70 sold)
		let sales_potential = "uninformed";
		$(element)
			.find("span.su-styled-text.primary.bold.large")
			.each((_, el) => {
				const txt = $(el).text().trim();
				if (/sold|watcher|hot|trending/i.test(txt)) {
					sales_potential = txt;
				}
			});

		// Description (all subtitle-row text)
		const description = getText("div.s-card__subtitle-row");

		// Seller name and feedback (from attributes secondary)
		const seller_name = $(element)
			.find(
				"div.su-card-container__attributes__secondary .s-card__attribute-row .su-styled-text.primary.large"
			)
			.first()
			.text()
			.trim();
		const seller_feedback = $(element)
			.find(
				"div.su-card-container__attributes__secondary .s-card__attribute-row .su-styled-text.primary.large"
			)
			.eq(1)
			.text()
			.trim();

		// Watchers (optional)
		const watchers = $(element)
			.find(
				"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.primary.bold.large"
			)
			.text()
			.trim();

		// Delivery info (optional)
		const delivery = $(element)
			.find(
				"div.su-card-container__attributes__primary .s-card__attribute-row .su-styled-text.secondary.large"
			)
			.first()
			.text()
			.trim();

		// Image
		const thumbnail =
			$(element).find("img.s-card__image").attr("src") || "";

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
			seller_name: seller_name,
			seller_feedback: seller_feedback,
			watchers: watchers,
			delivery: delivery,
			link: url,
			thumbnail: thumbnail,
		});
	});

	$.root().empty();
	return ebay_products;
}

function extractProductInfo($, id, link) {
	const getText = (el, selector) => el.find(selector).text().trim();
	const getAttr = (el, selector, attr) => el.find(selector).attr(attr);

	const product = $("div.main-container");
	const seller = $("div#STORE_INFORMATION");
	const images = $("div.ux-image-grid.no-scrollbar");

	// Seller info
	const seller_infos = [];
	seller.each((_, element) => {
		const seller_name = getAttr(
			$(element),
			"div.x-store-information__store-name-wrapper > h2",
			"title"
		);
		const positive_feedback = getText(
			$(element),
			"div.x-store-information__store-name-wrapper > h4.x-store-information__highlights > span.ux-textspans"
		).split("%");
		seller_infos.push({
			seller: seller_name
				? seller_name.replace(/[_-]/g, " ").toUpperCase()
				: undefined,
			logotype: getAttr(
				$(element),
				"img.x-store-information__logo",
				"src"
			),
			contact: getAttr(
				$(element),
				"div.x-store-information__cta-container > a.ux-call-to-action.fake-btn.fake-btn--secondary",
				"href"
			),
			positive_feedback: positive_feedback[0] + "%",
			sold_items: getText(
				$(element),
				"div.x-store-information__store-name-wrapper > h4.x-store-information__highlights > span.ux-textspans.ux-textspans--SECONDARY"
			),
			number_feedbacks: getText(
				$(element),
				"h2.fdbk-detail-list__title > span.SECONDARY"
			).replace(/[()]/g, ""),
			store_link: getAttr(
				$(element),
				"div.x-store-information__header > a",
				"href"
			),
		});
	});

	// Product images
	const product_images = [];
	images.find("button > img").each((_, imgElement) => {
		const url = $(imgElement).attr("src");
		if (url) product_images.push(url);
	});

	// Product info
	const product_info = [];
	product.each((_, element) => {
		const product_name = getText(
			$(element),
			"div.vim.x-item-title > h1.x-item-title__mainTitle > span.ux-textspans.ux-textspans--BOLD"
		);
		const qtd_available = getText(
			$(element),
			"div#qtyAvailability > span.ux-textspans.ux-textspans--SECONDARY"
		).split(/(available)+/g);
		const quantity_available =
			qtd_available[0].trim().length > 0
				? qtd_available[0].trim().concat(" available")
				: "undefined";
		const qtd_sold = getText(
			$(element),
			"div#qtyAvailability > span.ux-textspans.ux-textspans--BOLD.ux-textspans--EMPHASIS"
		).split(/("sold")+/g);
		const quantity_sold =
			qtd_sold[0].trim().length > 0
				? qtd_sold[0].trim().concat(" sold")
				: "undefined";
		const price = getText($(element), "div.x-price-primary");
		const discounted_price = getText(
			$(element),
			"div.x-bin-price__content > div.x-additional-info "
		);
		const logistics_cost = getText(
			$(element),
			"div.ux-labels-values.col-12.ux-labels-values--shipping"
		);
		const last_24_hours = getText(
			$(element),
			"div.vi-notify-new-bg-dBtm > span"
		);
		const delivery_global = getText(
			$(element),
			"div.ux-labels-values.col-12.ux-labels-values__column-last-row.ux-labels-values--deliverto"
		);
		const delivery_local = getText(
			$(element),
			"td.ux-table-section__cell > span.ux-textspans > span.ux-textspans.ux-textspans--BOLD"
		);
		const return_period = getText(
			$(element),
			"div.ux-labels-values.col-12.ux-labels-values__column-last-row.ux-labels-values--returns > div.ux-labels-values__values.col-9"
		);
		const description = getText(
			$(element),
			"h1.x-item-title__mainTitle > span"
		);
		const upc = $(
			"div#viTabs_0_is > div.ux-layout-section-module-evo__container > div.ux-layout-section-module-evo > div.ux-layout-section-evo.ux-layout-section--features > div.ux-layout-section-evo__item.ux-layout-section-evo__item--table-view > div.ux-layout-section-evo__row > div.ux-layout-section-evo__col > dl.ux-labels-values.ux-labels-values--inline.col-6.ux-labels-values--upc > dd.ux-labels-values__values > div.ux-labels-values__values-content"
		)
			.text()
			.trim();
		const aen_code = getText(
			$(element),
			"dl.ux-labels-values.ux-labels-values--inline.col-6.ux-labels-values__column-last-row.ux-labels-values--ean > dd.ux-labels-values__values > div.ux-labels-values__values-content > div > span.ux-textspans"
		);
		const shipping = getText(
			$(element),
			"div.ux-labels-values__values-content > div > span.ux-textspans.ux-textspans--SECONDARY"
		);

		const condition = getText(
			$(element),
			"div.vim.x-item-condition > div.x-item-condition-text > div.ux-icon-text > span.ux-icon-text__text > span.clipped"
		);

		product_info.push({
			product_id: id,
			product_name: product_name.replace(/[_-]/g, " "),
			condition: condition,
			link: link,
			quantity_available:
				quantity_available === "undefined"
					? "1"
					: quantity_available.match(/\d+/)?.[0] || "1",
			quantity_sold:
				!quantity_sold || quantity_sold === "undefined"
					? "uninformed"
					: quantity_sold.match(/\d+/)?.[0],
			price:
				price.length > 0
					? price.replace(/[\r\n\t]/gm, "")
					: discounted_price.replace(/[\r\n\t]/gm, ""),
			discounted_price: discounted_price,
			logistics_cost: logistics_cost,
			last_24_hours: last_24_hours,
			delivery:
				delivery_global.length > 0
					? delivery_global
					: delivery_local.length > 0
					? delivery_local
					: null,
			return_period: return_period.substring(
				0,
				return_period.indexOf(" ")
			),
			description: description.replace(/[_-]/g, " "),
			upc:
				upc && upc.length > 0
					? upc
					: aen_code && aen_code.length > 0
					? aen_code
					: null,
			aen: aen_code && aen_code.length > 0 ? aen_code : null,
			shipping: shipping,
			product_images: product_images,
			seller_infos: seller_infos,
		});
	});

	$.root().empty();
	return product_info;
}

function normalizeCountryQuery(queryCountry) {
	let country;
	if (
		typeof queryCountry === "string" &&
		queryCountry !== null &&
		queryCountry.trim()
	) {
		country = queryCountry.trim().toLowerCase().replace(/\s+/g, " ");
	} else {
		country = "us";
	}

	if (!subdomainsMap[country]) {
		country = "us";
	}

	return country;
}

export default class ProductsController {
	static async getProducts(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const country = normalizeCountryQuery(req.query.country);
			const domain = subdomainsMap["usa"];
			const buy_now = false || req.query.buy_now;

			let { product_name } = req.query;
			if (typeof product_name !== "string") {
				return res.status(400).json({
					error: "Invalid product name",
					details: "Product name must be a string",
				});
			}

			let link = `${domain}/sch/i.html?_nkw=${product_name}&_sacat=0&_from=R33&_ipg=240&_sop=12`;

			if (buy_now == true) {
				link.concat("&LH_BIN=1");
			}

			if (
				typeof product_name === "string" &&
				product_name.length >= MINIMUM_OF_LETTERS
			) {
				const controller = new AbortController();
				req.on("close", () => {
					console.warn(
						`Request aborted by client: ${req.method} ${req.originalUrl}`
					);
					controller.abort();
				});
				axios
					.get(link, { signal: controller.signal })
					.then((response) => {
						const html = response.data;
						const $ = cheerio.load(html);
						let ebay_products = extractProductListHorizontal(
							$,
							product_name
						);

						if (ebay_products.length === 0) {
							ebay_products = extractProductListVertical(
								$,
								product_name
							);
						}

						if (ebay_products.length === 0 || !ebay_products) {
							res.status(404).json({
								error: "No products found",
								details: `No products found for ${product_name}`,
							});
							return;
						}
						res.json(ebay_products);
					})
					.catch((err) => {
						if (err.name === "AbortError") {
							console.warn(
								`Aborted request detected: ${req.method} ${req.originalUrl}`
							);
							return; // Request was aborted due to timeout or client disconnect
						}
						res.json({
							error: `Unable to search ${product_name} on server`,
							details: `${err}`,
						});
					});
			} else {
				res.status(412).json({
					error: "[412] Precondition failed",
					details: "Provide a product name",
				});
			}
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
						: "Unable to get products on server",
				details: `${err.message}`,
			});
		}
	}

	static async getProductById(req, res) {
		try {
			validateApiKey(req.headers["x-api-key"]);

			const { id } = req.params;
			const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, "");
			const country = normalizeCountryQuery(req.query.country);
			const domain =
				subdomainsMap["usa"] || subdomainsMap[country] || SERVER;

			// Create a list of domains to try
			// Start with the requested country
			const triedDomains = new Set();
			const domainsToTry = [];
			if (subdomainsMap[country]) {
				domainsToTry.push(subdomainsMap[country]);
				triedDomains.add(subdomainsMap[country]);
			}

			// Add the other domains, without repeating
			for (const key in subdomainsMap) {
				const dom = subdomainsMap[key];
				if (!triedDomains.has(dom)) {
					domainsToTry.push(dom);
					triedDomains.add(dom);
				}
			}

			// Add SERVER if not in the list
			if (SERVER && !triedDomains.has(SERVER)) {
				domainsToTry.push(SERVER);
			}

			let found = false;
			let lastError = null;
			let foundDomain = null;
			let foundProductInfo = null;

			const controller = new AbortController();
			req.on("close", () => {
				console.warn(
					`Request aborted by client: ${req.method} ${req.originalUrl}`
				);
				controller.abort();
			});

			for (const domain of domainsToTry) {
				// First, try {domain}/itm/{id}
				let link = `${domain}/itm/${sanitizedId}`;
				try {
					let html = (
						await limit(() =>
							axios.get(link, { signal: controller.signal })
						)
					)?.data;
					let $ = cheerio.load(html);
					let product_info = extractProductInfo($, id, link);
					if (product_info && product_info.length > 0) {
						foundDomain = domain;
						foundProductInfo = product_info;
						break;
					}
				} catch (err) {
					if (err.name === "AbortError") {
						console.warn(
							`Aborted request detected: ${req.method} ${req.originalUrl}`
						);
						return; // Request was aborted due to timeout or client disconnect
					}
					lastError = err;
					// If not found, try {domain}/p/{id}
					try {
						link = `${domain}/p/${sanitizedId}`;
						const html = (
							await limit(() =>
								axios.get(link, { signal: controller.signal })
							)
						)?.data;
						const $ = cheerio.load(html);
						const product_info = extractProductInfo($, id, link);
						if (product_info && product_info.length > 0) {
							foundDomain = domain;
							foundProductInfo = product_info;
							break;
						}
					} catch (err2) {
						if (err2.name === "AbortError") {
							return;
						}
						lastError = err2;
						// Keep trying in the next domains
					}
				}
			}

			if (foundProductInfo) {
				const requestedDomain =
					subdomainsMap[country] || subdomainsMap["usa"] || SERVER;

				// Check if the found domain is a US domain
				const usDomains = [subdomainsMap["us"], subdomainsMap["usa"]];
				const found_in_global_store = usDomains.includes(foundDomain);

				let request_info = {
					requested_domain: requestedDomain,
					found_in_domain: foundDomain,
					found_in_global_store: found_in_global_store,
					found_in_requested_domain: foundDomain === requestedDomain,
				};

				if (foundDomain !== requestedDomain) {
					request_info.message = `The product is probably no longer available on ${requestedDomain}, but is available on ${foundDomain}.`;
				}

				foundProductInfo.push(request_info);

				return res.json(foundProductInfo);
			}

			// If you did not find it in any domain
			return res.status(404).json({
				error: "[404] Not found",
				details: `The product ${id} was not found in any supported eBay subdomain.`,
				lastError: lastError ? `${lastError}` : undefined,
			});
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
						: "Unable to get product by id on server",
				details: `${err.message}`,
			});
		}
	}
}
