import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register invoice-related tools
 * @param {object} server - MCP server instance
 */
export function registerInvoiceTools(server) {
  // Tool: Get invoice by ID
  server.tool(
    "get_invoice_by_id",
    "Get detailed information about an invoice by its ID",
    {
      invoice_id: z.number().describe("The ID of the invoice")
    },
    async ({ invoice_id }) => {
      try {
        const invoice = await callMagentoApi(`/invoices/${invoice_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching invoice: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search invoices
  server.tool(
    "search_invoices",
    "Search for invoices with various filters",
    {
      order_id: z.number().optional().describe("Filter by order ID"),
      state: z.number().optional().describe("Filter by invoice state (1=open, 2=paid, 3=canceled)"),
      date_from: z.string().optional().describe("Filter invoices created from this date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter invoices created until this date (YYYY-MM-DD)"),
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

        const invoices = await callMagentoApi(`/invoices?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(invoices, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching invoices: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create invoice for order
  server.tool(
    "create_invoice",
    "Create an invoice for an order",
    {
      order_id: z.number().describe("The entity ID of the order"),
      capture: z.boolean().optional().describe("Whether to capture payment (default: false)"),
      notify_customer: z.boolean().optional().describe("Whether to notify customer (default: false)"),
      items: z.array(z.object({
        order_item_id: z.number(),
        qty: z.number()
      })).optional().describe("Specific items to invoice (if not provided, all items will be invoiced)")
    },
    async ({ order_id, capture = false, notify_customer = false, items }) => {
      try {
        const invoiceData = {
          capture,
          notify: notify_customer
        };

        if (items && items.length > 0) {
          invoiceData.items = items;
        }

        const result = await callMagentoApi(`/order/${order_id}/invoice`, 'POST', invoiceData);
        return {
          content: [{ type: "text", text: `Invoice created successfully. Invoice ID: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating invoice: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}
