# eBay Scraper API – Endpoint Documentation

API for intelligent scraping of eBay products with centralized API key validation, concurrency control, automatic retries, and automated testing.  
This API is a public utility. It may change or be discontinued without notice.

## Version

Current stable: **v4.0.0**

---

## 1. Authentication

All protected endpoints require the header:

```bash

```bash
	x-api-key: <your-base64-key>
```

### Endpoints

#### API Status

-   `GET /status` and `GET /status/api`: Returns the API status.

**Response:**

```json
{
	"msg": "API status 🚀",
	"name": "ebay-scraper-api",
	"version": "4.0.0-beta",
	"uptime": 1710000000000,
}
```


#### Search products

-   `GET /products`: Search for products on eBay.

**Query parameters**

-   **product_name** (_required_): Product name to search.
-   **buy_now** (_optional_): If true, only "Buy Now" products.

**Example**

```bash
	GET /products?product_name=iphone
```

**Response**

```json
[
	{
        "product_id": "296868673755",
        "name": "2025 Smart Watch For Men/Women, Waterproof Smartwatch Bluetooth iPhone Samsung*",
        "condition": "Brand New",
        "price": "$17.99",
        "description": "Brand New",
        "seller_name": "blackviewshop",
        "seller_feedback": "99.5% positive (3.4K)",
        "watchers": "517 sold",
        "delivery": "$59.99",
        "link": "https://www.ebay.com/itm/296868673755?_skw=smart+watch&hash=item451ec078db%3Ag%3AJl8AAeSwewtosD3M&itmprp=enc%3AAQAKAAAA0FkggFvd1GGDu0w3yXCmi1en9UigzGScqREd0EdGFKc%2FMMrMW%2Bf4Pyl7ozd39f18wX1%2FzRpkUogLtkhhQRtZkD6dIzmJ1ZdByDWkjYWO%2Flc0owV4aDSNl1yKh5FeggBIqmylNUYTyopR9vfeEmeCCK6fUGoDOlKdT%2FGIUBbkH19V5nW%2FMXTrv3hIA252aTxqk7CJfBg22mUXRKZ4VxnoGigDsqslYLq%2FTrZ%2BYqlc9Z1qqk3tmCQUAGCAICCVwlbiBGZ2BeYnl91aBMp2T%2BNVn%2Bo%3D%7Ctkp%3ABk9SR5rdzrvqZg&LH_BIN=1",
        "thumbnail": "https://i.ebayimg.com/images/g/Jl8AAeSwewtosD3M/s-l140.jpg"
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

**Example**

```bash
	GET /products/12345
```

**Response**

```json
[
	{
        "product_id": "296868673755",
        "product_name": "2025 Smart Watch For Men/Women, Waterproof Smartwatch Bluetooth iPhone Samsung*",
        "condition": "New",
        "link": "https://www.ebay.com/itm/296868673755",
        "quantity_available": "1",
        "quantity_sold": "517",
        "price": "US $17.99/ea",
        "discounted_price": "Was US $59.99 What does this price mean?Recent sales price provided by the sellerSave US $42.00 (70% off)",
        "logistics_cost": "Shipping:Free eBay Economy. See detailsfor shippingLocated in: United States",
        "last_24_hours": "",
        "delivery": "Delivery:Estimated between Fri, Jan 2 and Wed, Jan 7 to 94043Estimated delivery dates - opens in a new window or tab include seller's handling time, origin ZIP Code, destination ZIP Code and time of acceptance and will depend on shipping service selected and receipt of cleared paymentcleared payment - opens in a new window or tab. Delivery times may vary, especially during peak periods.",
        "return_period": "30",
        "description": "2025 Smart Watch For Men/Women, Waterproof Smartwatch Bluetooth iPhone Samsung*",
        "upc": "0614161126648",
        "aen": null,
        "shipping": "Located in: United States",
        "product_images": [
            "https://i.ebayimg.com/images/g/Jl8AAeSwewtosD3M/s-l140.jpg",
            "https://i.ebayimg.com/images/g/I5cAAeSwdador~ww/s-l140.png",
            "https://i.ebayimg.com/images/g/bhYAAOSwBIVnQUe2/s-l140.jpg",
            "https://i.ebayimg.com/images/g/BOAAAOSw4SJm9lOX/s-l140.webp",
            "https://i.ebayimg.com/images/g/GWIAAOSw-pNm9lOY/s-l140.webp",
            "https://i.ebayimg.com/images/g/~CgAAOSwy7hm9lOa/s-l140.webp"
        ],
        "seller_infos": {
            "seller": "BLACKVIEWSHOP",
            "positive_feedback": "99.5%",
            "sold_items": "16K items sold",
            "number_feedbacks": "3,800"
        }
    }
]
```

**Response codes**:

-   **200**: Success
-   **404**: Product not found in any domain
-   **412**: Invalid API key
-   **500**: Internal error


#### Seller

-   `GET /seller`: Search for products from a specific seller.

**Query parameters**

-   **seller_name** (_required_): Seller name

**Example**

```bash
	GET /seller?seller_name=beststore
```

**Response**

```json
[
	{
        "product_id": "376040919648",
        "name": "12-in-1 4K Star Projector Night Light 360° Galaxy Planetarium Lamp Gift",
        "condition": "Brand New",
        "price": "$41.68",
        "description": "Brand New",
        "link": "https://www.ebay.com/itm/376040919648?hash=item578dc91260:g:uoEAAOSwRRxnxt-S",
        "thumbnail": "https://i.ebayimg.com/images/g/uoEAAOSwRRxnxt-S/s-l140.jpg"
    },
	...
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
