# Magento 2 MCP Server - Architecture Documentation

# Local Setup

## Prerequisites

- Magento 2 project
- Node.js installed

## Configuration

- Copy the file `template/.mcp.json` into your Magento project root.
- Fill in the variables in `.mcp.json` with your own values:
    - **`[CUSTOM_SERVER_NAME]`** Give a name to your server (in case of having more than one server you can identify
      each one and execute each one by their name in the chat)
    - **`[NODE_PATH]`** Run `which node` and copy the resulting path.
    - **`[MCP_SERVER_PATH]`** Path to `magento-mcp-server.js`.
    - **`MAGENTO_BASE_URL`** `https://magento2url.local/rest/V1`
    - **`MAGENTO_API_TOKEN`** Use your user API key, or create an Integration in Magento and use its Access Token.
    - **`NODE_TLS_REJECT_UNAUTHORIZED`** Enables or disables the use of self-signed certificates.  
      Set to `0` to allow all certificates.

## Running the Server

```bash
 node magento-mcp-server.js
```

## Configure MCP in Your AI Tool

### Claude

#### Claude Desktop

- Add the same `.mcp.json` content to the `claude_desktop_config.json` file located in the Claude Desktop folder.
- You can find and edit this file via:  
  `File → Settings → Developer → Edit configuration`  
  (this will show the file path).

#### Claude Code

- When you run Claude Code inside the Magento 2 project, it will automatically read the `.mcp.json` file and suggest
  using this MCP server.

## Directory Structure

```
magento2-mcp-server/
├── magento-mcp-server.js                    # Main server file
├── package.json
├── package-lock.json
├── README.md
└── template/
    └── .mcp.json                     # Magento configuration server file
└── src/
    ├── config.js                     # Configuration and environment variables
    ├── utils/
    │   ├── api-client.js            # Magento API client and pagination utilities
    │   ├── date-utils.js            # Date parsing and formatting utilities
    │   └── formatters.js            # Response formatting utilities
    └── tools/
        ├── products.js              # Product management tools (9 tools)
        ├── categories.js            # Category management tools (8 tools)
        ├── customers.js             # Customer management tools (7 tools)
        ├── orders.js                # Order management tools (10 tools)
        ├── analytics.js             # Analytics and reporting tools (5 tools)
        ├── invoices.js              # Invoice management tools (3 tools)
        ├── shipments.js             # Shipment management tools (4 tools)
        ├── creditmemos.js           # Credit memo management tools (3 tools)
        ├── stock.js                 # Inventory management tools (6 tools)
        ├── carts.js                 # Cart management tools (6 tools)
        ├── cms.js                   # CMS blocks and pages tools (10 tools)
        ├── store.js                 # Store configuration tools (6 tools)
        ├── attributes.js            # Product attribute tools (6 tools)
        ├── media.js                 # Product media tools (5 tools)
        ├── promotions.js            # Promotions and coupons tools (5 tools)
        ├── url-rewrites.js          # URL rewrite tools (1 tool)
        └── tax.js                   # Tax management tools (3 tools)
```

## Module Breakdown

### Core Files

#### `magento-mcp-server.js` (Main Entry Point)

- Creates the MCP server instance
- Imports and registers all tool modules
- Starts the stdio transport

### Configuration Layer

#### `src/config/index.js`

**Purpose**: Centralized configuration management

**Exports**:

- `MAGENTO_BASE_URL` - Magento API base URL
- `MAGENTO_API_TOKEN` - API authentication token
- `httpsAgent` - HTTPS agent for handling self-signed certificates

### Utility Layer

#### `src/utils/api-client.js`

**Purpose**: Magento API communication

**Exports**:

- `callMagentoApi(endpoint, method, data)` - Make authenticated API requests
- `fetchAllPages(endpoint, searchCriteria)` - Fetch all pages of paginated results

#### `src/utils/date-utils.js`

**Purpose**: Date parsing and formatting utilities

**Exports**:

- `parseDateExpression(dateExpression)` - Parse expressions like "today", "last month", "ytd"
- `formatDateForMagento(date)` - Format dates for Magento API
- `buildDateRangeFilter(field, startDate, endDate)` - Build date range filters
- `normalizeCountry(country)` - Normalize country names to ISO codes
- `endOfYear(date)` - Get end of year date

#### `src/utils/formatters.js`

**Purpose**: Response formatting utilities

**Exports**:

- `formatProduct(product)` - Format product data for readability
- `formatSearchResults(results)` - Format search results

### Tool Modules

Each tool module follows the same pattern:

1. Import required dependencies (`z` from zod, utilities from utils layer)
2. Define tool implementations using `server.tool()`
3. Export a registration function: `registerXxxTools(server)`

#### Products Module (`src/tools/products.js`) - 9 tools

- `get_product_by_sku` - Get product by SKU
- `search_products` - Search products
- `advanced_product_search` - Advanced product search with filters
- `update_product_attribute` - Update product attribute
- `create_product` - Create new product
- `update_product` - Update existing product
- `delete_product` - Delete product
- `assign_product_to_category` - Assign product to category
- `remove_product_from_category` - Remove product from category

#### Categories Module (`src/tools/categories.js`) - 8 tools

- `get_category_tree` - Get category tree structure
- `get_category_by_id` - Get category by ID
- `list_categories` - List categories with filters
- `get_products_in_category` - Get products in category
- `create_category` - Create new category
- `update_category` - Update category
- `delete_category` - Delete category
- `move_category` - Move category to different parent

#### Customers Module (`src/tools/customers.js`) - 7 tools

- `get_customer_by_id` - Get customer by ID
- `search_customers` - Search customers
- `get_customer_groups` - Get customer groups
- `get_customer_addresses` - Get customer addresses
- `create_customer` - Create new customer
- `update_customer` - Update customer
- `delete_customer` - Delete customer

#### Orders Module (`src/tools/orders.js`) - 10 tools

- `get_order_by_id` - Get order by entity ID
- `get_order_by_increment_id` - Get order by increment ID
- `search_orders` - Search orders with filters
- `get_order_items` - Get order items
- `get_order_comments` - Get order comments
- `add_order_comment` - Add order comment
- `cancel_order` - Cancel order
- `hold_order` - Put order on hold
- `unhold_order` - Remove order hold
- `get_order_statuses` - Get order statuses

#### Analytics Module (`src/tools/analytics.js`) - 5 tools

- `get_revenue` - Get revenue by date range
- `get_order_count` - Get order count by date range
- `get_product_sales` - Get product sales statistics
- `get_revenue_by_country` - Get revenue filtered by country
- `get_customer_ordered_products_by_email` - Get customer's ordered products

#### Invoices Module (`src/tools/invoices.js`) - 3 tools

- `get_invoice_by_id` - Get invoice by ID
- `search_invoices` - Search invoices
- `create_invoice` - Create invoice

#### Shipments Module (`src/tools/shipments.js`) - 4 tools

- `get_shipment_by_id` - Get shipment by ID
- `search_shipments` - Search shipments
- `create_shipment` - Create shipment
- `add_shipment_tracking` - Add tracking to shipment

#### Credit Memos Module (`src/tools/creditmemos.js`) - 3 tools

- `get_creditmemo_by_id` - Get credit memo by ID
- `search_creditmemos` - Search credit memos
- `create_creditmemo` - Create credit memo (refund)

#### Stock Module (`src/tools/stock.js`) - 6 tools

- `get_product_stock` - Get product stock
- `update_product_stock` - Update stock quantity
- `get_low_stock_products` - Get low stock products
- `get_inventory_sources` - Get MSI inventory sources
- `get_inventory_stocks` - Get MSI inventory stocks
- `get_source_items` - Get source items for SKU

#### Carts Module (`src/tools/carts.js`) - 6 tools

- `get_cart_by_id` - Get cart by ID
- `search_carts` - Search carts
- `get_cart_items` - Get cart items
- `get_shipping_methods` - Get shipping methods
- `get_payment_methods` - Get payment methods
- `get_abandoned_carts` - Get abandoned carts

#### CMS Module (`src/tools/cms.js`) - 10 tools

- `get_cms_block_by_id` - Get CMS block by ID
- `search_cms_blocks` - Search CMS blocks
- `create_cms_block` - Create CMS block
- `update_cms_block` - Update CMS block
- `delete_cms_block` - Delete CMS block
- `get_cms_page_by_id` - Get CMS page by ID
- `search_cms_pages` - Search CMS pages
- `create_cms_page` - Create CMS page
- `update_cms_page` - Update CMS page
- `delete_cms_page` - Delete CMS page

#### Store Module (`src/tools/store.js`) - 6 tools

- `get_store_configs` - Get store configurations
- `get_store_views` - Get store views
- `get_websites` - Get websites
- `get_store_groups` - Get store groups
- `get_countries` - Get countries
- `get_currency_info` - Get currency information

#### Attributes Module (`src/tools/attributes.js`) - 6 tools

- `get_product_attribute` - Get product attribute
- `search_product_attributes` - Search product attributes
- `get_attribute_options` - Get attribute options
- `add_attribute_option` - Add attribute option
- `get_attribute_sets` - Get attribute sets
- `get_attribute_set_attributes` - Get attributes in set

#### Media Module (`src/tools/media.js`) - 5 tools

- `get_product_media` - Get product media
- `get_product_media_entry` - Get specific media entry
- `add_product_image` - Add product image
- `update_product_media` - Update media entry
- `delete_product_media` - Delete media entry

#### Promotions Module (`src/tools/promotions.js`) - 5 tools

- `get_sales_rules` - Get cart price rules
- `get_sales_rule_by_id` - Get sales rule by ID
- `search_coupons` - Search coupons
- `get_coupon_by_id` - Get coupon by ID
- `delete_coupon` - Delete coupon

#### URL Rewrites Module (`src/tools/url-rewrites.js`) - 1 tool

- `search_url_rewrites` - Search URL rewrites

#### Tax Module (`src/tools/tax.js`) - 3 tools

- `get_tax_rates` - Get tax rates
- `get_tax_rules` - Get tax rules
- `get_tax_classes` - Get tax classes

## Total Statistics

- **Total Tools**: 101
- **Total Modules**: 17 tool modules + 3 utility modules + 1 config module
- **Total Modular Code**: ~4,282 lines across src/ directory

## Benefits of Modular Architecture

1. **Maintainability**: Each module is focused on a single entity/domain
2. **Scalability**: Easy to add new tools by creating new modules
3. **Readability**: Main file is now only 96 lines
4. **Reusability**: Utility functions are centralized and reusable
5. **Testing**: Easier to test individual modules in isolation
6. **Collaboration**: Multiple developers can work on different modules
7. **Organization**: Clear separation of concerns

## Adding New Tools

To add a new tool:

1. **If the tool belongs to an existing entity**, add it to the appropriate module in `src/tools/`
2. **If it's a new entity**, create a new module following this pattern:

```javascript
// src/tools/new-entity.js
const {z} = require('zod');
const {callMagentoApi} = require('../utils/api-client');

function registerNewEntityTools(server) {
    // Tool 1
    server.tool(
        "tool_name",
        "Tool description",
        {
            param1: z.string().describe("Parameter description")
        },
        async ({param1}) => {
            try {
                const data = await callMagentoApi('/endpoint');
                return {
                    content: [{type: "text", text: JSON.stringify(data, null, 2)}]
                };
            } catch (error) {
                return {
                    content: [{type: "text", text: `Error: ${error.message}`}],
                    isError: true
                };
            }
        }
    );
}

module.exports = {registerNewEntityTools};
```

3. **Import and register in `magento-mcp-server.js`**:

```javascript
const {registerNewEntityTools} = require('./src/tools/new-entity');

// In the registration section
console.error('Registering New Entity tools...');
registerNewEntityTools(server);
```

## Version History

- **v1.0.0**: Original version
- **v2.0.0**: Moduled version and more tools added

## Copyright
Based on magento2-mcp by Bold Commerce                                                                                                                                                                         
https://github.com/boldcommerce/magento2-mcp                                                                                                                                                                   
Copyright (c) Bold Commerce Inc.

Modifications Copyright [2025] [Dani Carrero/danykurosaki]