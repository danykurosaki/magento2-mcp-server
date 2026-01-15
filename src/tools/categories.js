import { z } from 'zod';
import { callMagentoApi, fetchAllPages } from '../utils/api-client.js';

/**
 * Helper function to format search results for products
 * @param {object} results - Search results from Magento API
 * @returns {object|string} Formatted results
 */
function formatSearchResults(results) {
  if (!results || !results.items || !Array.isArray(results.items)) {
    return "No products found";
  }

  return {
    total_count: results.total_count,
    items: results.items.map(item => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      price: item.price,
      status: item.status,
      type_id: item.type_id
    }))
  };
}

/**
 * Register all category-related tools
 * @param {object} server - MCP server instance
 */
function registerCategoryTools(server) {
  // Tool: Get category tree
  server.tool(
    "get_category_tree",
    "Get the complete category tree structure of the store",
    {
      root_category_id: z.number().optional().describe("Root category ID to start from (default: 1)")
    },
    async ({ root_category_id = 1 }) => {
      try {
        const categoryTree = await callMagentoApi(`/categories?rootCategoryId=${root_category_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(categoryTree, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching category tree: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get category by ID
  server.tool(
    "get_category_by_id",
    "Get detailed information about a category by its ID",
    {
      category_id: z.number().describe("The ID of the category")
    },
    async ({ category_id }) => {
      try {
        const category = await callMagentoApi(`/categories/${category_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(category, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching category: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: List categories with filters
  server.tool(
    "list_categories",
    "List categories with optional filtering",
    {
      parent_id: z.number().optional().describe("Filter by parent category ID"),
      name: z.string().optional().describe("Filter by category name (partial match)"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ parent_id, name, is_active, page_size = 20, current_page = 1 }) => {
      try {
        let filterIndex = 0;
        let searchCriteria = `searchCriteria[pageSize]=${page_size}&searchCriteria[currentPage]=${current_page}`;

        if (parent_id !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=parent_id` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${parent_id}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
          filterIndex++;
        }

        if (name) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=name` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=%25${encodeURIComponent(name)}%25` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=like`;
          filterIndex++;
        }

        if (is_active !== undefined) {
          searchCriteria += `&searchCriteria[filter_groups][${filterIndex}][filters][0][field]=is_active` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][value]=${is_active ? 1 : 0}` +
                           `&searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]=eq`;
        }

        const categories = await callMagentoApi(`/categories/list?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(categories, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing categories: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get products in category
  server.tool(
    "get_products_in_category",
    "Get all products assigned to a specific category",
    {
      category_id: z.number().describe("The ID of the category"),
      page_size: z.number().optional().describe("Number of results per page (default: 20)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ category_id, page_size = 20, current_page = 1 }) => {
      try {
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=category_id` +
                              `&searchCriteria[filter_groups][0][filters][0][value]=${category_id}` +
                              `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq` +
                              `&searchCriteria[pageSize]=${page_size}` +
                              `&searchCriteria[currentPage]=${current_page}`;

        const products = await callMagentoApi(`/products?${searchCriteria}`);
        return {
          content: [{ type: "text", text: JSON.stringify(formatSearchResults(products), null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching products in category: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Create category
  server.tool(
    "create_category",
    "Create a new category",
    {
      name: z.string().describe("Category name"),
      parent_id: z.number().describe("Parent category ID"),
      is_active: z.boolean().optional().describe("Whether the category is active (default: true)"),
      include_in_menu: z.boolean().optional().describe("Include in navigation menu (default: true)"),
      description: z.string().optional().describe("Category description"),
      url_key: z.string().optional().describe("URL key for the category")
    },
    async ({ name, parent_id, is_active = true, include_in_menu = true, description, url_key }) => {
      try {
        const categoryData = {
          category: {
            name,
            parent_id,
            is_active,
            include_in_menu,
            custom_attributes: []
          }
        };

        if (description) {
          categoryData.category.custom_attributes.push({ attribute_code: 'description', value: description });
        }
        if (url_key) {
          categoryData.category.custom_attributes.push({ attribute_code: 'url_key', value: url_key });
        }

        const result = await callMagentoApi('/categories', 'POST', categoryData);
        return {
          content: [{ type: "text", text: `Category created successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update category
  server.tool(
    "update_category",
    "Update an existing category",
    {
      category_id: z.number().describe("The ID of the category to update"),
      name: z.string().optional().describe("New category name"),
      is_active: z.boolean().optional().describe("Whether the category is active"),
      include_in_menu: z.boolean().optional().describe("Include in navigation menu"),
      description: z.string().optional().describe("Category description"),
      position: z.number().optional().describe("Sort position")
    },
    async ({ category_id, name, is_active, include_in_menu, description, position }) => {
      try {
        const categoryData = { category: { custom_attributes: [] } };

        if (name !== undefined) categoryData.category.name = name;
        if (is_active !== undefined) categoryData.category.is_active = is_active;
        if (include_in_menu !== undefined) categoryData.category.include_in_menu = include_in_menu;
        if (position !== undefined) categoryData.category.position = position;
        if (description !== undefined) {
          categoryData.category.custom_attributes.push({ attribute_code: 'description', value: description });
        }

        const result = await callMagentoApi(`/categories/${category_id}`, 'PUT', categoryData);
        return {
          content: [{ type: "text", text: `Category updated successfully:\n${JSON.stringify(result, null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete category
  server.tool(
    "delete_category",
    "Delete a category by ID",
    {
      category_id: z.number().describe("The ID of the category to delete")
    },
    async ({ category_id }) => {
      try {
        const result = await callMagentoApi(`/categories/${category_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Category ${category_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Move category
  server.tool(
    "move_category",
    "Move a category to a different parent",
    {
      category_id: z.number().describe("The ID of the category to move"),
      parent_id: z.number().describe("The new parent category ID"),
      after_id: z.number().optional().describe("Position after this category ID")
    },
    async ({ category_id, parent_id, after_id }) => {
      try {
        const moveData = { parentId: parent_id };
        if (after_id !== undefined) {
          moveData.afterId = after_id;
        }

        const result = await callMagentoApi(`/categories/${category_id}/move`, 'PUT', moveData);
        return {
          content: [{ type: "text", text: `Category moved successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error moving category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerCategoryTools
};
