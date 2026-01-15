import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register all CMS-related tools with the MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerCmsTools(server) {
  // ==========================================
  // CMS BLOCK TOOLS
  // ==========================================

  // Tool: Get CMS block by ID
  server.tool(
    "get_cms_block_by_id",
    "Get a CMS block by its ID",
    {
      block_id: z.number().describe("The ID of the CMS block")
    },
    async ({ block_id }) => {
      try {
        const block = await callMagentoApi(`/cmsBlock/${block_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(block, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching CMS block: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search CMS blocks
  server.tool(
    "search_cms_blocks",
    "Search for CMS blocks with various filters",
    {
      identifier: z.string().optional().describe("Filter by block identifier"),
      title: z.string().optional().describe("Filter by title (partial match)"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ identifier, title, is_active, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (identifier) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=identifier` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(identifier)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (title) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=title` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(title)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (is_active !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_active` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_active ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
        }

        const blocks = await callMagentoApi(`/cmsBlock/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(blocks, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching CMS blocks: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create CMS block
  server.tool(
    "create_cms_block",
    "Create a new CMS block",
    {
      identifier: z.string().describe("Unique identifier for the block"),
      title: z.string().describe("Block title"),
      content: z.string().describe("Block content (HTML)"),
      is_active: z.boolean().optional().describe("Whether the block is active (default: true)"),
      store_ids: z.array(z.number()).optional().describe("Store IDs where block is available (default: [0] for all stores)")
    },
    async ({ identifier, title, content, is_active = true, store_ids = [0] }) => {
      try {
        const blockData = {
          block: {
            identifier,
            title,
            content,
            active: is_active,
            store_id: store_ids
          }
        };

        const result = await callMagentoApi('/cmsBlock', 'POST', blockData);
        return {
          content: [{ type: "text", text: `CMS block created successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating CMS block: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update CMS block
  server.tool(
    "update_cms_block",
    "Update an existing CMS block",
    {
      block_id: z.number().describe("The ID of the block to update"),
      identifier: z.string().optional().describe("New identifier"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New content (HTML)"),
      is_active: z.boolean().optional().describe("Whether the block is active")
    },
    async ({ block_id, identifier, title, content, is_active }) => {
      try {
        // First get existing block
        const existingBlock = await callMagentoApi(`/cmsBlock/${block_id}`);

        const blockData = {
          block: {
            id: block_id,
            identifier: identifier || existingBlock.identifier,
            title: title || existingBlock.title,
            content: content !== undefined ? content : existingBlock.content,
            active: is_active !== undefined ? is_active : existingBlock.active
          }
        };

        const result = await callMagentoApi(`/cmsBlock/${block_id}`, 'PUT', blockData);
        return {
          content: [{ type: "text", text: `CMS block updated successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating CMS block: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete CMS block
  server.tool(
    "delete_cms_block",
    "Delete a CMS block by ID",
    {
      block_id: z.number().describe("The ID of the block to delete")
    },
    async ({ block_id }) => {
      try {
        const result = await callMagentoApi(`/cmsBlock/${block_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `CMS block ${block_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting CMS block: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // ==========================================
  // CMS PAGE TOOLS
  // ==========================================

  // Tool: Get CMS page by ID
  server.tool(
    "get_cms_page_by_id",
    "Get a CMS page by its ID",
    {
      page_id: z.number().describe("The ID of the CMS page")
    },
    async ({ page_id }) => {
      try {
        const page = await callMagentoApi(`/cmsPage/${page_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(page, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching CMS page: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Search CMS pages
  server.tool(
    "search_cms_pages",
    "Search for CMS pages with various filters",
    {
      identifier: z.string().optional().describe("Filter by page identifier/URL key"),
      title: z.string().optional().describe("Filter by title (partial match)"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ identifier, title, is_active, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (identifier) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=identifier` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${encodeURIComponent(identifier)}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (title) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=title` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(title)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (is_active !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_active` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_active ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
        }

        const pages = await callMagentoApi(`/cmsPage/search?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(pages, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error searching CMS pages: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create CMS page
  server.tool(
    "create_cms_page",
    "Create a new CMS page",
    {
      identifier: z.string().describe("URL key for the page"),
      title: z.string().describe("Page title"),
      content: z.string().describe("Page content (HTML)"),
      content_heading: z.string().optional().describe("Content heading"),
      page_layout: z.string().optional().describe("Page layout (1column, 2columns-left, 2columns-right, 3columns, empty)"),
      meta_title: z.string().optional().describe("Meta title for SEO"),
      meta_keywords: z.string().optional().describe("Meta keywords for SEO"),
      meta_description: z.string().optional().describe("Meta description for SEO"),
      is_active: z.boolean().optional().describe("Whether the page is active (default: true)"),
      store_ids: z.array(z.number()).optional().describe("Store IDs where page is available (default: [0] for all stores)")
    },
    async ({ identifier, title, content, content_heading, page_layout = '1column', meta_title, meta_keywords, meta_description, is_active = true, store_ids = [0] }) => {
      try {
        const pageData = {
          page: {
            identifier,
            title,
            content,
            page_layout,
            active: is_active,
            store_id: store_ids
          }
        };

        if (content_heading) pageData.page.content_heading = content_heading;
        if (meta_title) pageData.page.meta_title = meta_title;
        if (meta_keywords) pageData.page.meta_keywords = meta_keywords;
        if (meta_description) pageData.page.meta_description = meta_description;

        const result = await callMagentoApi('/cmsPage', 'POST', pageData);
        return {
          content: [{ type: "text", text: `CMS page created successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating CMS page: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update CMS page
  server.tool(
    "update_cms_page",
    "Update an existing CMS page",
    {
      page_id: z.number().describe("The ID of the page to update"),
      identifier: z.string().optional().describe("New URL key"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New content (HTML)"),
      is_active: z.boolean().optional().describe("Whether the page is active")
    },
    async ({ page_id, identifier, title, content, is_active }) => {
      try {
        // First get existing page
        const existingPage = await callMagentoApi(`/cmsPage/${page_id}`);

        const pageData = {
          page: {
            id: page_id,
            identifier: identifier || existingPage.identifier,
            title: title || existingPage.title,
            content: content !== undefined ? content : existingPage.content,
            active: is_active !== undefined ? is_active : existingPage.active
          }
        };

        const result = await callMagentoApi(`/cmsPage/${page_id}`, 'PUT', pageData);
        return {
          content: [{ type: "text", text: `CMS page updated successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating CMS page: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete CMS page
  server.tool(
    "delete_cms_page",
    "Delete a CMS page by ID",
    {
      page_id: z.number().describe("The ID of the page to delete")
    },
    async ({ page_id }) => {
      try {
        const result = await callMagentoApi(`/cmsPage/${page_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `CMS page ${page_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting CMS page: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}
