# Change Log

## [Unreleased] or [Released on <date>]

### Added

### Fixed

### Changed

### Removed

## [Released on December 25, 2025] - Version 4.0.0

### Added

-   Dockerfile optimized to run the API with plain Node.js (ESM) and prepared for deployment on platforms such as Cloud Run.
-   Makefile targets to standardize local and cloud workflows:
    -   `run-dev` for local development.
    -   `run-test` for running the test suite.
    -   `build-docker` and `run-docker` for building and running the Docker image locally.
    -   `build-image`, `push-image`, and `deploy-cloudrun` for building, pushing, and deploying the image to Cloud Run.

### Fixed

-   Fixed the `buy_now` parameter handling in `GET /products` so the “Buy It Now” filter (`&LH_BIN=1`) is correctly applied to the eBay search URL.
-   Adjusted tests and dependencies to work properly with modern Node.js and native ES Modules (no Babel), keeping Jest compatible with the current setup.

### Changed

-   Simplified `index.js`:
    -   Removed in-memory response caching with `node-cache`.
    -   Removed manual garbage collection logic and heap usage monitoring.
    -   Kept only the essentials: `.env` loading, JSON body parser, rate limiting, routes, and global error/404 handlers.
-   Standardized `package.json` scripts for Node.js:
    -   `"start": "node index.js"` for production.
    -   `"dev": "nodemon --inspect index.js"` for development.
-   Updated the build and deployment flow to use the official `node:22-slim` image in the Dockerfile.

### Removed

-   Removed the cache middleware and all related configuration (NodeCache, TTLs, and `res.json` monkey patching).
-   Removed manual garbage collection management (`global.gc`, memory threshold checks, and related logs).
-   Removed Babel-related configuration and dependencies in favor of running directly on Node.js with ES Modules.


## [Released on September 5, 2025]

### Added

-   Rate limiting middleware to restrict each IP to 30 requests per second, protecting the API from abuse and accidental overload.
-   Timeout middleware with AbortController support for all controllers that make HTTP requests, ensuring requests are aborted if the client disconnects or a timeout occurs.
-   Security improvements: limited JSON body size to 1MB.
-   Enhanced product list extraction logic to robustly capture `discount`, `product_location`, `logistics_cost`, and `sales_potential` fields based on the real eBay HTML structure.
-   More robust selectors and heuristics for extracting all relevant product fields from eBay search results.

### Fixed

-   Fixed issue where discount, product_location, logistics_cost, and sales_potential fields were returning "uninformed" due to incorrect selectors.
-   Fixed error responses to never leak API_KEY or sensitive information.
-   Fixed potential memory leaks by ensuring Cheerio DOMs are always emptied after parsing.

### Changed

-   Updated the rate limit configuration from 100 requests per minute to 30 requests per second for more granular and effective traffic control.
-   Refactored all controllers to use AbortController for axios requests, improving resource management and reliability.
-   Updated extractProductList to use more accurate and flexible selectors for all key product fields.
-   Improved error handling and response consistency across all endpoints.

### Removed

-   Removed legacy or redundant selectors and logic from product extraction functions.

## [Released on August 10, 2025]

### Added

-   Implemented comprehensive unit tests for all controllers and middleware, including:
    -   ProductsController, DealsController, SellersController, StatusController, and verifyCache middleware.
    -   100% line and branch coverage, covering happy paths, edge cases, and error cases.
-   Added centralized API key validation utility (validateApiKey) in utils/auth.js and refactored all controllers to use it.
-   Added error handling for missing or invalid API key in all endpoints.
-   Added fallback logic in product detail endpoint to search across all eBay subdomains, returning the first found product and indicating the domain.
-   Added support for HEAD requests in status endpoint to avoid decoding errors.
-   Added Procfile for deployment on platforms like Heroku/Railway.
-   Added Babel config with ES module syntax for Jest compatibility.
-   Added instructions and support for running tests with Jest and Babel in ES module projects.
-   Ensures that $(element) returns the element mock itself, avoiding "is not a function" errors.
-   Adjusts mock utilities to facilitate maintenance and reuse in tests.
-   Ensures that all scraping and API key tests pass with full coverage.

### Fixed

-   Fixed bug where multiple responses could be sent in controllers, causing ERR_HTTP_HEADERS_SENT.
-   Fixed ReferenceError for api_key by removing legacy variable usage after refactoring to use validateApiKey.
-   Fixed import errors by ensuring .js extension is used in all ES module imports.
-   Fixed decoding errors in status endpoint by switching to HEAD requests.
-   Fixed cache middleware to handle undefined id and errors thrown by cache methods.
-   Fixed all Cheerio mocks in controller tests (Products, Deals, Sellers) to correctly simulate .find, .text, .attr, and .each, allowing realistic element parsing.
-   Fixed and standardized scripts and configurations to run Jest with ES Modules and Babel.

### Changed

-   Refactored all controllers to use the centralized validateApiKey function for API key validation.
-   Refactored error handling in controllers to use try-catch and return appropriate status codes and messages.
-   Refactored product detail endpoint to return additional info about the domain where the product was found.
-   Refactored test setup to use Babel ES module syntax for compatibility with Jest.
    Updated test scripts and documentation for running tests in ES module projects.

### Removed

-   Removed manual API key decoding and validation logic from all controllers.
-   Removed duplicate and legacy error handling code in controllers.
-   Removed unused variables and legacy code paths after refactoring to use centralized utilities.
-   Removed direct use of got for HTTP requests; all requests now use axios.

## [Released on June 7, 2025]

### Added

-   Add concurrency control, automatic request retries, and memory optimizations across HTTP fetching and caching
-   Add axios-retry and p-limit dependencies
-   Improve getProductById by extracting parsing logic into a reusable function and adding a US domain fallback when a product isn’t found in the specified country.

### Fixed

-   Limit concurrent product detail requests to avoid server overload
-   Retry failed Axios requests up to 3 times with exponential backoff on network errors and HTTP 5xx/429 statuses
-   Optimize memory by increasing cache TTL, capping cache size, freeing Cheerio DOMs, and scheduling periodic garbage collection

### Changed

-   Destructure API_KEY from environment variables for consistency
-   Bump version to 3.0.0 and update start/dev scripts to include memory limits and debugging
-   Extract and centralize product and seller info parsing into a new extractProductInfo function to remove duplication
-   Refactor getProductById to use extractProductInfo and destructure request parameters for clarity

## [Released on May 22, 2025]

### Added

-   Validation of the `country` parameter to ensure that only valid subdomains are used, with fallback to "us" (USA) if invalid.
-   Support for accepting "us" or "usa" as the value for the `country` parameter instead of the full link.

### Changed

-   The default value for the `country` parameter is now "us" instead of the full link.
-   Adjusted the logic for obtaining the domain to use the mapped subdomain or the default.

## [Released on April 19, 2025]

### Fixed

-   Fixed a bug where the buy now filter was not being applied correctly in `GET /products`.

### Changed

-   Refactored subdomains array into a map for faster lookups.
-   Refactored UPC selector GET/products/{id}

### Removed

-   Removed unused page_number variable from GET/products search
