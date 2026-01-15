import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all stock and inventory related tools
 * @param {object} server - The MCP server instance
 */
export function registerStockTools(server) {
  // Tool: Get product stock information
  server.tool(
    "get_product_stock",
    "Get stock information for a product by SKU",
    {
      sku: z.string().describe("The SKU (Stock Keeping Unit) of the product")
    },
    async ({ sku }) => {
      try {
        const stockData = await callMagentoApi(`/stockItems/${sku}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stockData, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching stock information: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Update product stock
  server.tool(
    "update_product_stock",
    "Update stock quantity for a product",
    {
      sku: z.string().describe("The SKU of the product"),
      qty: z.number().describe("New quantity"),
      is_in_stock: z.boolean().optional().describe("Whether the product is in stock (default: true if qty > 0)")
    },
    async ({ sku, qty, is_in_stock }) => {
      try {
        const stockData = {
          stockItem: {
            qty,
            is_in_stock: is_in_stock !== undefined ? is_in_stock : qty > 0
          }
        };

        const result = await callMagentoApi(`/products/${sku}/stockItems/1`, 'PUT', stockData);
        return {
          content: [{ type: "text", text: `Stock updated successfully for ${sku}:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating stock: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get low stock products
  server.tool(
    "get_low_stock_products",
    "Get products with low stock levels",
    {
      threshold: z.number().optional().describe("Stock threshold to consider low (default: 10)"),
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ threshold = 10, page_size = 50, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=qty` +
                              `&searchCriteria[filter_groups][0][filters][0][value]=${threshold}` +
                              `&searchCriteria[filter_groups][0][filters][0][condition_type]=lteq` +
                              `&searchCriteria[filter_groups][1][filters][0][field]=qty` +
                              `&searchCriteria[filter_groups][1][filters][0][value]=0` +
                              `&searchCriteria[filter_groups][1][filters][0][condition_type]=gt` +
                              `&searchCriteria[pageSize]=${page_size}` +
                              `&searchCriteria[currentPage]=${current_page}`;

        const products = await callMagentoApi(`/stockItems/lowStock?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(products, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching low stock products: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get inventory sources (MSI)
  server.tool(
    "get_inventory_sources",
    "Get all inventory sources (Multi-Source Inventory)",
    {
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ page_size = 50, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;
        const sources = await callMagentoApi(`/inventory/sources?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(sources, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching inventory sources: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get inventory stocks (MSI)
  server.tool(
    "get_inventory_stocks",
    "Get all inventory stocks (Multi-Source Inventory)",
    {},
    async () => {
      try {
        const searchCriteria = 'searchCriteria[pageSize]=100';
        const stocks = await callMagentoApi(`/inventory/stocks?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(stocks, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching inventory stocks: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get source items for SKU (MSI)
  server.tool(
    "get_source_items",
    "Get source items (inventory per source) for a SKU",
    {
      sku: z.string().describe("The SKU of the product")
    },
    async ({ sku }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=sku` +
                              `&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(sku)}` +
                              `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

        const sourceItems = await callMagentoApi(`/inventory/source-items?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(sourceItems, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching source items: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
