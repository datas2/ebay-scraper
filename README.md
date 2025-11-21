# eBay Scraper API – Endpoint Documentation

API for intelligent scraping of eBay products, offers, and sellers, with centralized API key validation, concurrency control, optimized caching, multi-domain search, and automated testing with full coverage. Includes robust endpoints for querying products, details, offers, server status, and seller status, plus intelligent fallback between subdomains and comprehensive error handling.

## v3.x.x-beta (new release)

### Authentication

All endpoints (except `/status` and `/status/api`) require the header:

```bash
	x-api-key: <your-base64-key>
```

### Endpoints

#### Supported Countries

To search in a specific eBay subdomain, use the `country` query parameter with one of the following values:

| Country        | Code        | Subdomain               |
| -------------- | ----------- | ----------------------- |
| United States  | us, usa     | https://www.ebay.com    |
| Philippines    | philippines | https://www.ebay.ph     |
| australia      | australia   | https://www.ebay.com.au |
| Austria        | austria     | https://www.ebay.at     |
| Canada         | canada      | https://www.ebay.ca     |
| France         | france      | https://www.ebay.fr     |
| Germany        | germany     | https://www.ebay.de     |
| Hong Kong      | hong kong   | https://www.ebay.com.hk |
| Ireland        | ireland     | https://www.ebay.ie     |
| Italy          | italy       | https://www.ebay.it     |
| Malaysia       | malaysia    | https://www.ebay.com.my |
| Netherlands    | netherlands | https://www.ebay.nl     |
| Poland         | poland      | https://www.ebay.pl     |
| Singapore      | singapore   | https://www.ebay.com.sg |
| Spain          | spain       | https://www.ebay.es     |
| Switzerland    | switzerland | https://www.ebay.ch     |
| United Kingdom | uk          | https://www.ebay.co.uk  |

#### API Status

-   `GET /status` and `GET /status/api`: Returns the API status.

**Response:**

```json
{
	"msg": "API status 🚀",
	"name": "ebay-scraper-api",
	"environment": "production",
	"version": "3.3.1-beta",
	"uptime": 1710000000000,
	"hash": "uuid"
}
```

#### Server Status

-   `GET /status/server`: Returns the scraping server (eBay) status.

**Response:**

```json
{
	"msg": "Server status 🚀",
	"name": "ebay-scraper-server",
	"environment": "production",
	"version": "3.3.1-beta",
	"status": "200",
	"status_text": "OK",
	"uptime": 1710000000000,
	"hash": "uuid"
}
```

#### Search products

-   `GET /products`: Search for products on eBay.

**Query parameters**

-   **product_name** (_required_): Product name to search.
-   **country** (_optional_): eBay country/subdomain (e.g. us, france, germany). Default: us.
-   **buy_now** (_optional_): If true, only "Buy Now" products.

**Example**

```bash
	GET /products?product_name=iphone&country=us
```

**Response**

```json
[
	{
		"product_id": "12345",
		"name": "IPHONE",
		"condition": "NEW",
		"price": "$1000",
		"discount": "uninformed",
		"product_location": "USA",
		"logistics_cost": "$10",
		"description": "SOME DESCRIPTION",
		"sales_potential": "uninformed",
		"link": "https://www.ebay.com/itm/12345",
		"reviews": "https://www.ebay.com/itm/12345#reviews",
		"thumbnail": "https://img.ebay.com/1.jpg"
	}
]
```

**Response codes**

-   **200**: Success
-   **400**: Invalid product name
-   **412**: Product name too short or invalid API key
-   **500**: Internal error

#### Product details

-   `GET /products/:id`: Get product details by ID, searching across multiple domains and returning domain info.

**Route parameters**

-   **id**: Product ID

**Query parameters**

-   **country** (_optional_): eBay country/subdomain (e.g. us, france, ...)

**Example**

```bash
	GET /products/12345?country=france
```

**Response**

```json
[
	{
		"product_id": "12345",
		"product_name": "iPhone 14",
		"condition": "NEW",
		"price": "$1000",
		"seller_infos": [ ... ],
		"product_images": [ ... ],
		...
	},
	{
		"requested_domain": "https://www.ebay.fr",
		"found_in_domain": "https://www.ebay.com",
		"found_in_global_store": true,
		"found_in_requested_domain": false,
		"message": "The product is probably no longer available on https://www.ebay.fr, but is available on https://www.ebay.com."
	}
]
```

**Response codes**:

-   **200**: Success
-   **404**: Product not found in any domain
-   **412**: Invalid API key
-   **500**: Internal error

#### Deals

-   `GET /deals`: Returns featured deals from eBay.
-   `GET /deals/tech`: Returns tech deals.
-   `GET /deals/fashion`: Returns fashion deals.
-   `GET /deals/home`: Returns home/decoration deals.

**Response**

```json
[
	{
		"product_name": "Product 1",
		"price": "10.00",
		"original_price": "20.00",
		"currency": "USD",
		"discount": "-50.00%",
		"product_condition": "New",
		"sale_status": "Hot",
		"link": "https://ebay.com/p1",
		"image": "https://img.com/1.jpg"
	}
]
```

**Response codes**

-   **200**: Success
-   **412**: Invalid API key
-   **500**: Internal error

#### Seller

-   `GET /seller`: Search for products from a specific seller.

**Query parameters**

-   **seller_name** (_required_): Seller name
-   **page** (_optional_): Results page (default: 1)

**Example**

```bash
	GET /seller?seller_name=beststore&page=2
```

**Response**

```json
[
	{
		"product_id": "12345",
		"name": "PRODUCT 1",
		"condition": "NEW",
		"price": "$100",
		"product_location": "USA",
		"logistics_cost": "$10",
		"link": "https://www.ebay.com/itm/12345",
		"thumbnail": "https://img.ebay.com/1.jpg"
	}
]
```

**Response codes**

-   **200**: Success
-   **412**: Seller name too short or invalid API key
-   **500**: Internal error

### Notes

-   All endpoints (except `/status`) require the `x-api-key` header with the key encoded in base64.
-   Scraping endpoints may return extra fields depending on the product or seller.
-   In case of error, the response will have the format:

```json
{
	"error": "Error description",
	"details": "Technical details"
}
```
