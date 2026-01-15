import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all customer-related tools with the MCP server
 * @param {object} server - MCP server instance
 */
function registerCustomerTools(server) {
  // Tool: Get customer by ID
  server.tool(
    "get_customer_by_id",
    "Get detailed information about a customer by their ID",
    {
      customer_id: z.number().describe("The ID of the customer")
    },
    async ({ customer_id }) => {
      try {
        const customer = await callMagentoApi(`/customers/${customer_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(customer, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching customer: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search customers
  server.tool(
    "search_customers",
    "Search for customers with various filters",
    {
      email: z.string().optional().describe("Filter by email (partial match)"),
      firstname: z.string().optional().describe("Filter by first name (partial match)"),
      lastname: z.string().optional().describe("Filter by last name (partial match)"),
      group_id: z.number().optional().describe("Filter by customer group ID"),
      website_id: z.number().optional().describe("Filter by website ID"),
      created_at_from: z.string().optional().describe("Filter by creation date from (YYYY-MM-DD)"),
      created_at_to: z.string().optional().describe("Filter by creation date to (YYYY-MM-DD)"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ email, firstname, lastname, group_id, website_id, created_at_from, created_at_to, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (email) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=email` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(email)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (firstname) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=firstname` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(firstname)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (lastname) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=lastname` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(lastname)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (group_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=group_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${group_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (website_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=website_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${website_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (created_at_from) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${created_at_from}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=gteq`;
          filterIndex++;
        }

        if (created_at_to) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=created_at` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${created_at_to}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=lteq`;
          filterIndex++;
        }

        const result = await callMagentoApi(`/customers/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching customers: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get customer groups
  server.tool(
    "get_customer_groups",
    "Get all customer groups",
    {},
    async () => {
      try {
        const searchCriteria = 'searchCriteria[pageSize]=100';
        const groups = await callMagentoApi(`/customerGroups/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(groups, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching customer groups: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get customer addresses
  server.tool(
    "get_customer_addresses",
    "Get all addresses for a customer",
    {
      customer_id: z.number().describe("The ID of the customer")
    },
    async ({ customer_id }) => {
      try {
        const customer = await callMagentoApi(`/customers/${customer_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(customer.addresses || [], null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching customer addresses: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create customer
  server.tool(
    "create_customer",
    "Create a new customer account",
    {
      email: z.string().email().describe("Customer email address"),
      firstname: z.string().describe("Customer first name"),
      lastname: z.string().describe("Customer last name"),
      password: z.string().optional().describe("Customer password (if not provided, a random one will be generated)"),
      group_id: z.number().optional().describe("Customer group ID (default: 1 - General)"),
      website_id: z.number().optional().describe("Website ID (default: 1)"),
      store_id: z.number().optional().describe("Store ID (default: 1)")
    },
    async ({ email, firstname, lastname, password, group_id = 1, website_id = 1, store_id = 1 }) => {
      try {
        const customerData = {
          customer: {
            email,
            firstname,
            lastname,
            group_id,
            website_id,
            store_id
          }
        };

        if (password) {
          customerData.password = password;
        }

        const result = await callMagentoApi('/customers', 'POST', customerData);
        return {
          content: [{ type: "text", text: `Customer created successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating customer: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update customer
  server.tool(
    "update_customer",
    "Update an existing customer",
    {
      customer_id: z.number().describe("The ID of the customer to update"),
      email: z.string().email().optional().describe("New email address"),
      firstname: z.string().optional().describe("New first name"),
      lastname: z.string().optional().describe("New last name"),
      group_id: z.number().optional().describe("New customer group ID")
    },
    async ({ customer_id, email, firstname, lastname, group_id }) => {
      try {
        // First get existing customer data
        const existingCustomer = await callMagentoApi(`/customers/${customer_id}`);

        const customerData = {
          customer: {
            id: customer_id,
            email: email || existingCustomer.email,
            firstname: firstname || existingCustomer.firstname,
            lastname: lastname || existingCustomer.lastname,
            website_id: existingCustomer.website_id
          }
        };

        if (group_id !== undefined) {
          customerData.customer.group_id = group_id;
        }

        const result = await callMagentoApi(`/customers/${customer_id}`, 'PUT', customerData);
        return {
          content: [{ type: "text", text: `Customer updated successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating customer: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete customer
  server.tool(
    "delete_customer",
    "Delete a customer by ID",
    {
      customer_id: z.number().describe("The ID of the customer to delete")
    },
    async ({ customer_id }) => {
      try {
        const result = await callMagentoApi(`/customers/${customer_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Customer ${customer_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting customer: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}

export { registerCustomerTools };
