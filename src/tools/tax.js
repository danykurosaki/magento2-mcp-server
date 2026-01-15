import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all tax-related tools
 * @param {object} server - MCP server instance
 */
function registerTaxTools(server) {
  // Tool: Get tax rates
  server.tool(
    "get_tax_rates",
    "Get all tax rates",
    {
      page_size: z.number().optional().describe("Number of results per page (default: 100)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ page_size = 100, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;
        const rates = await callMagentoApi(`/taxRates/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(rates, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching tax rates: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get tax rules
  server.tool(
    "get_tax_rules",
    "Get all tax rules",
    {
      page_size: z.number().optional().describe("Number of results per page (default: 100)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ page_size = 100, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;
        const rules = await callMagentoApi(`/taxRules/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(rules, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching tax rules: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get tax classes
  server.tool(
    "get_tax_classes",
    "Get all tax classes",
    {
      tax_class_type: z.string().optional().describe("Filter by type: CUSTOMER or PRODUCT")
    },
    async ({ tax_class_type }) => {
      try {
        let searchCriteria = 'searchCriteria[pageSize]=100';

        if (tax_class_type) {
          searchCriteria += `&searchCriteria[filter_groups][0][filters][0][field]=class_type` +
                           `&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(tax_class_type)}` +
                           `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        }

        const classes = await callMagentoApi(`/taxClasses/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(classes, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching tax classes: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerTaxTools
};
