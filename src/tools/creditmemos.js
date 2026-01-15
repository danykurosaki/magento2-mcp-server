import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register credit memo (refund) related tools
 * @param {object} server - MCP server instance
 */
export function registerCreditmemoTools(server) {
  // Tool: Get credit memo by ID
  server.tool(
    "get_creditmemo_by_id",
    "Get detailed information about a credit memo (refund) by its ID",
    {
      creditmemo_id: z.number().describe("The ID of the credit memo")
    },
    async ({ creditmemo_id }) => {
      try {
        const creditmemo = await callMagentoApi(`/creditmemo/${creditmemo_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(creditmemo, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching credit memo: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search credit memos
  server.tool(
    "search_creditmemos",
    "Search for credit memos (refunds) with various filters",
    {
      order_id: z.number().optional().describe("Filter by order ID"),
      state: z.number().optional().describe("Filter by credit memo state (1=open, 2=refunded, 3=canceled)"),
      date_from: z.string().optional().describe("Filter credit memos created from this date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter credit memos created until this date (YYYY-MM-DD)"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ order_id, state, date_from, date_to, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (order_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=order_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${order_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (state !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=state` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${state}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (date_from) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(date_from + ' 00:00:00')}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=gteq`;
          filterIndex++;
        }

        if (date_to) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(date_to + ' 23:59:59')}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=lteq`;
        }

        const creditmemos = await callMagentoApi(`/creditmemos?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(creditmemos, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching credit memos: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create credit memo (refund) for order
  server.tool(
    "create_creditmemo",
    "Create a credit memo (refund) for an order",
    {
      order_id: z.number().describe("The entity ID of the order"),
      notify_customer: z.boolean().optional().describe("Whether to notify customer (default: false)"),
      items: z.array(z.object({
        order_item_id: z.number(),
        qty: z.number()
      })).optional().describe("Specific items to refund"),
      adjustment_positive: z.number().optional().describe("Positive adjustment amount"),
      adjustment_negative: z.number().optional().describe("Negative adjustment amount"),
      shipping_amount: z.number().optional().describe("Shipping amount to refund")
    },
    async ({ order_id, notify_customer = false, items, adjustment_positive, adjustment_negative, shipping_amount }) => {
      try {
        const creditmemoData = {
          notify: notify_customer
        };

        if (items && items.length > 0) {
          creditmemoData.items = items;
        }

        if (adjustment_positive !== undefined) {
          creditmemoData.adjustment_positive = adjustment_positive;
        }

        if (adjustment_negative !== undefined) {
          creditmemoData.adjustment_negative = adjustment_negative;
        }

        if (shipping_amount !== undefined) {
          creditmemoData.shipping_amount = shipping_amount;
        }

        const result = await callMagentoApi(`/order/${order_id}/refund`, 'POST', creditmemoData);
        return {
          content: [{ type: "text", text: `Credit memo created successfully. Credit Memo ID: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating credit memo: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}
