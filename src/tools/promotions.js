import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all promotion/sales rules and coupon tools
 * @param {object} server - MCP server instance
 */
function registerPromotionTools(server) {

  // Tool: Get sales rules (cart price rules)
  server.tool(
    "get_sales_rules",
    "Get cart price rules (promotions)",
    {
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ page_size = 50, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;
        const rules = await callMagentoApi(`/salesRules/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(rules, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching sales rules: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get sales rule by ID
  server.tool(
    "get_sales_rule_by_id",
    "Get a specific cart price rule by ID",
    {
      rule_id: z.number().describe("The ID of the sales rule")
    },
    async ({ rule_id }) => {
      try {
        const rule = await callMagentoApi(`/salesRules/${rule_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(rule, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching sales rule: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search coupons
  server.tool(
    "search_coupons",
    "Search for coupons",
    {
      code: z.string().optional().describe("Filter by coupon code (partial match)"),
      rule_id: z.number().optional().describe("Filter by sales rule ID"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ code, rule_id, is_active, page_size = 50, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (code) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=code` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(code)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (rule_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=rule_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${rule_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        const coupons = await callMagentoApi(`/coupons/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(coupons, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching coupons: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get coupon by ID
  server.tool(
    "get_coupon_by_id",
    "Get a specific coupon by ID",
    {
      coupon_id: z.number().describe("The ID of the coupon")
    },
    async ({ coupon_id }) => {
      try {
        const coupon = await callMagentoApi(`/coupons/${coupon_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(coupon, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching coupon: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete coupon
  server.tool(
    "delete_coupon",
    "Delete a coupon by ID",
    {
      coupon_id: z.number().describe("The ID of the coupon to delete")
    },
    async ({ coupon_id }) => {
      try {
        const result = await callMagentoApi(`/coupons/${coupon_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Coupon ${coupon_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting coupon: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerPromotionTools
};
