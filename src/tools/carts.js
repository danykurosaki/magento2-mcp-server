import { z } from 'zod';
import { callMagentoApi, fetchAllPages } from '../utils/api-client.js';
import { parseDateExpression, buildDateRangeFilter } from '../utils/date-utils.js';
import { format } from 'date-fns';

/**
 * Register all cart-related tools
 * @param {object} server - MCP server instance
 */
function registerCartTools(server) {

  // Tool: Get cart by ID
  server.tool(
    "get_cart_by_id",
    "Get cart/quote details by cart ID",
    {
      cart_id: z.number().describe("The ID of the cart")
    },
    async ({ cart_id }) => {
      try {
        const cart = await callMagentoApi(`/carts/${cart_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(cart, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching cart: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search carts
  server.tool(
    "search_carts",
    "Search for carts/quotes with various filters",
    {
      customer_email: z.string().optional().describe("Filter by customer email"),
      customer_id: z.number().optional().describe("Filter by customer ID"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      created_at_from: z.string().optional().describe("Filter carts created from this date (YYYY-MM-DD)"),
      created_at_to: z.string().optional().describe("Filter carts created until this date (YYYY-MM-DD)"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ customer_email, customer_id, is_active, created_at_from, created_at_to, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (customer_email) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=customer_email` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(customer_email)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (customer_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=customer_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${customer_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (is_active !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_active` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_active ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (created_at_from) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(created_at_from + ' 00:00:00')}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=gteq`;
          filterIndex++;
        }

        if (created_at_to) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(created_at_to + ' 23:59:59')}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=lteq`;
        }

        const carts = await callMagentoApi(`/carts/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(carts, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching carts: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get cart items
  server.tool(
    "get_cart_items",
    "Get all items in a cart",
    {
      cart_id: z.number().describe("The ID of the cart")
    },
    async ({ cart_id }) => {
      try {
        const items = await callMagentoApi(`/carts/${cart_id}/items`);
        return {
          content: [{ type: "text", text: JSON.stringify(items, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching cart items: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get available shipping methods
  server.tool(
    "get_shipping_methods",
    "Get available shipping methods for the store",
    {},
    async () => {
      try {
        const methods = await callMagentoApi('/shipping-methods');
        return {
          content: [{ type: "text", text: JSON.stringify(methods, null, 2) }]
        };
      } catch (error) {
        // If the standard endpoint fails, try to get from configuration
        try {
          const config = await callMagentoApi('/store/storeConfigs');
          return {
            content: [{ type: "text", text: `Store configurations (shipping methods may vary by cart):\n${JSON.stringify(config, null, 2)}` }]
          };
        } catch (e) {
          return {
            content: [{ type: "text", text: `Error fetching shipping methods: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  );

  // Tool: Get available payment methods
  server.tool(
    "get_payment_methods",
    "Get available payment methods for the store",
    {},
    async () => {
      try {
        const methods = await callMagentoApi('/payment-methods');
        return {
          content: [{ type: "text", text: JSON.stringify(methods, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching payment methods: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get abandoned carts
  server.tool(
    "get_abandoned_carts",
    "Get abandoned carts (active carts older than specified days)",
    {
      days_old: z.number().optional().describe("Minimum days since cart was updated (default: 7)"),
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ days_old = 7, page_size = 50, current_page = 1 }) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days_old);
        const formattedDate = format(cutoffDate, 'yyyy-MM-dd HH:mm:ss');

        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=is_active` +
                              `&searchCriteria[filter_groups][0][filters][0][value]=1` +
                              `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq` +
                              `&searchCriteria[filter_groups][1][filters][0][field]=updated_at` +
                              `&searchCriteria[filter_groups][1][filters][0][value]=${encodeURIComponent(formattedDate)}` +
                              `&searchCriteria[filter_groups][1][filters][0][condition_type]=lteq` +
                              `&searchCriteria[filter_groups][2][filters][0][field]=items_count` +
                              `&searchCriteria[filter_groups][2][filters][0][value]=0` +
                              `&searchCriteria[filter_groups][2][filters][0][condition_type]=gt` +
                              `&searchCriteria[pageSize]=${page_size}` +
                              `&searchCriteria[currentPage]=${current_page}` +
                              `&searchCriteria[sortOrders][0][field]=updated_at` +
                              `&searchCriteria[sortOrders][0][direction]=DESC`;

        const carts = await callMagentoApi(`/carts/search?${searchCriteria}`);

        // Format response with useful info
        const formattedCarts = {
          total_count: carts.total_count,
          criteria: {
            days_abandoned: days_old,
            cutoff_date: formattedDate
          },
          items: carts.items?.map(cart => ({
            cart_id: cart.id,
            customer_email: cart.customer?.email || cart.customer_email,
            customer_name: cart.customer ? `${cart.customer.firstname} ${cart.customer.lastname}` : 'Guest',
            items_count: cart.items_count,
            grand_total: cart.grand_total,
            created_at: cart.created_at,
            updated_at: cart.updated_at
          })) || []
        };

        return {
          content: [{ type: "text", text: JSON.stringify(formattedCarts, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching abandoned carts: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerCartTools
};
