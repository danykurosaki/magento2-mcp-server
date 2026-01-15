import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all order-related tools with the MCP server
 * @param {object} server - MCP server instance
 */
function registerOrderTools(server) {
  // Tool: Get order by ID
  server.tool(
    "get_order_by_id",
    "Get detailed information about an order by its entity ID",
    {
      order_id: z.number().describe("The entity ID of the order")
    },
    async ({ order_id }) => {
      try {
        const order = await callMagentoApi(`/orders/${order_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(order, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching order: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get order by increment ID
  server.tool(
    "get_order_by_increment_id",
    "Get detailed information about an order by its increment ID (order number)",
    {
      increment_id: z.string().describe("The increment ID (order number) of the order")
    },
    async ({ increment_id }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=increment_id` +
                              `&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(increment_id)}` +
                              `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

        const orders = await callMagentoApi(`/orders?${searchCriteria}`);

        if (!orders.items || orders.items.length === 0) {
          return {
            content: [{ type: "text", text: `No order found with increment ID: ${increment_id}` }]
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(orders.items[0], null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching order: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search orders
  server.tool(
    "search_orders",
    "Search for orders with various filters",
    {
      status: z.string().optional().describe("Filter by order status (pending, processing, complete, canceled, etc.)"),
      customer_email: z.string().optional().describe("Filter by customer email"),
      customer_id: z.number().optional().describe("Filter by customer ID"),
      date_from: z.string().optional().describe("Filter orders created from this date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter orders created until this date (YYYY-MM-DD)"),
      grand_total_min: z.number().optional().describe("Minimum grand total"),
      grand_total_max: z.number().optional().describe("Maximum grand total"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)"),
      sort_field: z.string().optional().describe("Field to sort by (default: created_at)"),
      sort_direction: z.string().optional().describe("Sort direction: ASC or DESC (default: DESC)")
    },
    async ({ status, customer_email, customer_id, date_from, date_to, grand_total_min, grand_total_max, page_size = 20, current_page = 1, sort_field = 'created_at', sort_direction = 'DESC' }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}` +
                            `&searchCriteria[sortOrders][0][field]=${sort_field}&searchCriteria[sortOrders][0][direction]=${sort_direction}`;

        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=status` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(status)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

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
          filterIndex++;
        }

        if (grand_total_min !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=grand_total` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${grand_total_min}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=gteq`;
          filterIndex++;
        }

        if (grand_total_max !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=grand_total` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${grand_total_max}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=lteq`;
        }

        const orders = await callMagentoApi(`/orders?${searchCriteria}`);

        // Format orders for readability
        const formattedOrders = {
          total_count: orders.total_count,
          items: orders.items?.map(o => ({
            entity_id: o.entity_id,
            increment_id: o.increment_id,
            status: o.status,
            state: o.state,
            customer_email: o.customer_email,
            customer_firstname: o.customer_firstname,
            customer_lastname: o.customer_lastname,
            grand_total: o.grand_total,
            total_qty_ordered: o.total_qty_ordered,
            created_at: o.created_at,
            updated_at: o.updated_at
          })) || []
        };

        return {
          content: [{ type: "text", text: JSON.stringify(formattedOrders, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching orders: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get order items
  server.tool(
    "get_order_items",
    "Get all items from a specific order",
    {
      order_id: z.number().describe("The entity ID of the order")
    },
    async ({ order_id }) => {
      try {
        const order = await callMagentoApi(`/orders/${order_id}`);

        const formattedItems = order.items?.map(item => ({
          item_id: item.item_id,
          sku: item.sku,
          name: item.name,
          qty_ordered: item.qty_ordered,
          qty_shipped: item.qty_shipped,
          qty_invoiced: item.qty_invoiced,
          qty_refunded: item.qty_refunded,
          price: item.price,
          row_total: item.row_total,
          tax_amount: item.tax_amount,
          discount_amount: item.discount_amount,
          product_type: item.product_type
        })) || [];

        return {
          content: [{ type: "text", text: JSON.stringify(formattedItems, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching order items: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get order comments/history
  server.tool(
    "get_order_comments",
    "Get all comments/status history for an order",
    {
      order_id: z.number().describe("The entity ID of the order")
    },
    async ({ order_id }) => {
      try {
        const order = await callMagentoApi(`/orders/${order_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(order.status_histories || [], null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching order comments: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Add order comment
  server.tool(
    "add_order_comment",
    "Add a comment to an order's history",
    {
      order_id: z.number().describe("The entity ID of the order"),
      comment: z.string().describe("The comment text to add"),
      status: z.string().optional().describe("New order status (if changing status)"),
      is_customer_notified: z.boolean().optional().describe("Whether to notify the customer (default: false)"),
      is_visible_on_front: z.boolean().optional().describe("Whether the comment is visible to customer (default: false)")
    },
    async ({ order_id, comment, status, is_customer_notified = false, is_visible_on_front = false }) => {
      try {
        const commentData = {
          statusHistory: {
            comment,
            is_customer_notified: is_customer_notified ? 1 : 0,
            is_visible_on_front: is_visible_on_front ? 1 : 0,
            parent_id: order_id
          }
        };

        if (status) {
          commentData.statusHistory.status = status;
        }

        const result = await callMagentoApi(`/orders/${order_id}/comments`, 'POST', commentData);
        return {
          content: [{ type: "text", text: `Comment added successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error adding order comment: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Cancel order
  server.tool(
    "cancel_order",
    "Cancel an order by ID",
    {
      order_id: z.number().describe("The entity ID of the order to cancel")
    },
    async ({ order_id }) => {
      try {
        const result = await callMagentoApi(`/orders/${order_id}/cancel`, 'POST');
        return {
          content: [{ type: "text", text: `Order ${order_id} canceled successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error canceling order: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Hold order
  server.tool(
    "hold_order",
    "Put an order on hold",
    {
      order_id: z.number().describe("The entity ID of the order to hold")
    },
    async ({ order_id }) => {
      try {
        const result = await callMagentoApi(`/orders/${order_id}/hold`, 'POST');
        return {
          content: [{ type: "text", text: `Order ${order_id} put on hold. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error holding order: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Unhold order
  server.tool(
    "unhold_order",
    "Remove hold from an order",
    {
      order_id: z.number().describe("The entity ID of the order to unhold")
    },
    async ({ order_id }) => {
      try {
        const result = await callMagentoApi(`/orders/${order_id}/unhold`, 'POST');
        return {
          content: [{ type: "text", text: `Order ${order_id} hold removed. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error unholding order: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get order statuses
  server.tool(
    "get_order_statuses",
    "Get all available order statuses",
    {},
    async () => {
      try {
        const statuses = await callMagentoApi('/orders/statuses');
        return {
          content: [{ type: "text", text: JSON.stringify(statuses, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching order statuses: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerOrderTools
};
