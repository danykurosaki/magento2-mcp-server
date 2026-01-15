import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register shipment-related tools
 * @param {object} server - MCP server instance
 */
export function registerShipmentTools(server) {
  // Tool: Get shipment by ID
  server.tool(
    "get_shipment_by_id",
    "Get detailed information about a shipment by its ID",
    {
      shipment_id: z.number().describe("The ID of the shipment")
    },
    async ({ shipment_id }) => {
      try {
        const shipment = await callMagentoApi(`/shipment/${shipment_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(shipment, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching shipment: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search shipments
  server.tool(
    "search_shipments",
    "Search for shipments with various filters",
    {
      order_id: z.number().optional().describe("Filter by order ID"),
      date_from: z.string().optional().describe("Filter shipments created from this date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("Filter shipments created until this date (YYYY-MM-DD)"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ order_id, date_from, date_to, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (order_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=order_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${order_id}` +
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

        const shipments = await callMagentoApi(`/shipments?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(shipments, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching shipments: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create shipment for order
  server.tool(
    "create_shipment",
    "Create a shipment for an order",
    {
      order_id: z.number().describe("The entity ID of the order"),
      notify_customer: z.boolean().optional().describe("Whether to notify customer (default: false)"),
      items: z.array(z.object({
        order_item_id: z.number(),
        qty: z.number()
      })).optional().describe("Specific items to ship (if not provided, all unshipped items will be shipped)"),
      tracks: z.array(z.object({
        carrier_code: z.string(),
        title: z.string(),
        track_number: z.string()
      })).optional().describe("Tracking information to add")
    },
    async ({ order_id, notify_customer = false, items, tracks }) => {
      try {
        const shipmentData = {
          notify: notify_customer
        };

        if (items && items.length > 0) {
          shipmentData.items = items;
        }

        if (tracks && tracks.length > 0) {
          shipmentData.tracks = tracks;
        }

        const result = await callMagentoApi(`/order/${order_id}/ship`, 'POST', shipmentData);
        return {
          content: [{ type: "text", text: `Shipment created successfully. Shipment ID: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating shipment: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Add tracking to shipment
  server.tool(
    "add_shipment_tracking",
    "Add tracking information to an existing shipment",
    {
      shipment_id: z.number().describe("The ID of the shipment"),
      carrier_code: z.string().describe("Carrier code (e.g., 'ups', 'fedex', 'usps', 'dhl', 'custom')"),
      title: z.string().describe("Carrier title/name"),
      track_number: z.string().describe("Tracking number")
    },
    async ({ shipment_id, carrier_code, title, track_number }) => {
      try {
        const trackData = {
          entity: {
            carrier_code,
            title,
            track_number,
            parent_id: shipment_id
          }
        };

        const result = await callMagentoApi(`/shipment/track`, 'POST', trackData);
        return {
          content: [{ type: "text", text: `Tracking added successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error adding tracking: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}
