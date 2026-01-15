import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register product attribute tools
 * @param {Object} server - MCP server instance
 */
export function registerAttributeTools(server) {
  // ==========================================
  // PRODUCT ATTRIBUTE TOOLS
  // ==========================================

  // Tool: Get product attribute by code
  server.tool(
    "get_product_attribute",
    "Get a product attribute by its code",
    {
      attribute_code: z.string().describe("The attribute code (e.g., 'color', 'size', 'manufacturer')")
    },
    async ({ attribute_code }) => {
      try {
        const attribute = await callMagentoApi(`/products/attributes/${attribute_code}`);
        return {
          content: [{ type: "text", text: JSON.stringify(attribute, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching attribute: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search product attributes
  server.tool(
    "search_product_attributes",
    "Search for product attributes",
    {
      attribute_code: z.string().optional().describe("Filter by attribute code (partial match)"),
      frontend_input: z.string().optional().describe("Filter by frontend input type (text, textarea, select, multiselect, boolean, etc.)"),
      is_searchable: z.boolean().optional().describe("Filter by searchable flag"),
      is_filterable: z.boolean().optional().describe("Filter by filterable flag"),
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ attribute_code, frontend_input, is_searchable, is_filterable, page_size = 50, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (attribute_code) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=attribute_code` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(attribute_code)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (frontend_input) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=frontend_input` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(frontend_input)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (is_searchable !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_searchable` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_searchable ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (is_filterable !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_filterable` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_filterable ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
        }

        const attributes = await callMagentoApi(`/products/attributes?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(attributes, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching attributes: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get attribute options
  server.tool(
    "get_attribute_options",
    "Get all options for a select/multiselect attribute",
    {
      attribute_code: z.string().describe("The attribute code")
    },
    async ({ attribute_code }) => {
      try {
        const options = await callMagentoApi(`/products/attributes/${attribute_code}/options`);
        return {
          content: [{ type: "text", text: JSON.stringify(options, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching attribute options: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Add attribute option
  server.tool(
    "add_attribute_option",
    "Add a new option to a select/multiselect attribute",
    {
      attribute_code: z.string().describe("The attribute code"),
      label: z.string().describe("Option label"),
      sort_order: z.number().optional().describe("Sort order (default: 0)")
    },
    async ({ attribute_code, label, sort_order = 0 }) => {
      try {
        const optionData = {
          option: {
            label,
            sort_order,
            is_default: false
          }
        };

        const result = await callMagentoApi(`/products/attributes/${attribute_code}/options`, 'POST', optionData);
        return {
          content: [{ type: "text", text: `Attribute option added successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error adding attribute option: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get attribute sets
  server.tool(
    "get_attribute_sets",
    "Get all product attribute sets",
    {
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ page_size = 50, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;
        const sets = await callMagentoApi(`/products/attribute-sets/sets/list?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(sets, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching attribute sets: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get attributes in attribute set
  server.tool(
    "get_attribute_set_attributes",
    "Get all attributes in a specific attribute set",
    {
      attribute_set_id: z.number().describe("The ID of the attribute set")
    },
    async ({ attribute_set_id }) => {
      try {
        const attributes = await callMagentoApi(`/products/attribute-sets/${attribute_set_id}/attributes`);
        return {
          content: [{ type: "text", text: JSON.stringify(attributes, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching attribute set attributes: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
