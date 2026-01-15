import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all URL rewrite-related tools
 * @param {object} server - MCP server instance
 */
function registerUrlRewriteTools(server) {
  // Tool: Search URL rewrites
  server.tool(
    "search_url_rewrites",
    "Search for URL rewrites",
    {
      request_path: z.string().optional().describe("Filter by request path (partial match)"),
      target_path: z.string().optional().describe("Filter by target path (partial match)"),
      entity_type: z.string().optional().describe("Filter by entity type (product, category, cms-page)"),
      store_id: z.number().optional().describe("Filter by store ID"),
      page_size: z.number().optional().describe("Number of results per page (default: 50)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ request_path, target_path, entity_type, store_id, page_size = 50, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (request_path) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=request_path` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(request_path)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (target_path) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=target_path` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(target_path)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (entity_type) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=entity_type` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(entity_type)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (store_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=store_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${store_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
        }

        const rewrites = await callMagentoApi(`/url-rewrite?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(rewrites, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching URL rewrites: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerUrlRewriteTools
};
