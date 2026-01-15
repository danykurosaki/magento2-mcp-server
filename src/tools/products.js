import { z } from 'zod';
import { callMagentoApi, fetchAllPages } from '../utils/api-client.js';
import { formatProduct, formatSearchResults } from '../utils/formatters.js';

/**
 * Register all product-related tools with the MCP server
 * @param {object} server - MCP server instance
 */
function registerProductTools(server) {
  // Tool: Get product by SKU
  server.tool(
    "get_product_by_sku",
    "Get detailed information about a product by its SKU",
    {
      sku: z.string().describe("The SKU (Stock Keeping Unit) of the product")
    },
    async ({ sku }) => {
      try {
        const productData = await callMagentoApi(`/products/${sku}`);
        const formattedProduct = formatProduct(productData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedProduct, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching product: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Search products
  server.tool(
    "search_products",
    "Search for products using Magento search criteria",
    {
      query: z.string().describe("Search query (product name, description, etc.)"),
      page_size: z.number().optional().describe("Number of results per page (default: 10)"),
      current_page: z.number().optional().describe("Page number (default: 1)")
    },
    async ({ query, page_size = 10, current_page = 1 }) => {
      try {
        // Build search criteria for a simple name search
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=name&` +
                              `searchCriteria[filter_groups][0][filters][0][value]=%25${encodeURIComponent(query)}%25&` +
                              `searchCriteria[filter_groups][0][filters][0][condition_type]=like&` +
                              `searchCriteria[pageSize]=${page_size}&` +
                              `searchCriteria[currentPage]=${current_page}`;

        const productData = await callMagentoApi(`/products?${searchCriteria}`);
        const formattedResults = formatSearchResults(productData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedResults, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching products: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Advanced product search
  server.tool(
    "advanced_product_search",
    "Search for products with advanced filtering options",
    {
      field: z.string().describe("Field to search on (e.g., name, sku, price, status)"),
      value: z.string().describe("Value to search for"),
      condition_type: z.string().optional().describe("Condition type (eq, like, gt, lt, etc.). Default: eq"),
      page_size: z.number().optional().describe("Number of results per page (default: 10)"),
      current_page: z.number().optional().describe("Page number (default: 1)"),
      sort_field: z.string().optional().describe("Field to sort by (default: entity_id)"),
      sort_direction: z.string().optional().describe("Sort direction (ASC or DESC, default: DESC)")
    },
    async ({ field, value, condition_type = 'eq', page_size = 10, current_page = 1, sort_field = 'entity_id', sort_direction = 'DESC' }) => {
      try {
        // Build search criteria
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=${encodeURIComponent(field)}&` +
                              `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(value)}&` +
                              `searchCriteria[filter_groups][0][filters][0][condition_type]=${encodeURIComponent(condition_type)}&` +
                              `searchCriteria[pageSize]=${page_size}&` +
                              `searchCriteria[currentPage]=${current_page}&` +
                              `searchCriteria[sortOrders][0][field]=${encodeURIComponent(sort_field)}&` +
                              `searchCriteria[sortOrders][0][direction]=${encodeURIComponent(sort_direction)}`;

        const productData = await callMagentoApi(`/products?${searchCriteria}`);
        const formattedResults = formatSearchResults(productData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedResults, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing advanced search: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Update product attribute
  server.tool(
    "update_product_attribute",
    "Update a specific attribute of a product by SKU",
    {
      sku: z.string().describe("The SKU (Stock Keeping Unit) of the product"),
      attribute_code: z.string().describe("The code of the attribute to update (e.g., name, price, description, status, etc.)"),
      value: z.any().describe("The new value for the attribute")
    },
    async ({ sku, attribute_code, value }) => {
      try {
        // First, check if the product exists
        const productData = await callMagentoApi(`/products/${sku}`).catch(() => null);

        if (!productData) {
          return {
            content: [
              {
                type: "text",
                text: `Product with SKU '${sku}' not found`
              }
            ],
            isError: true
          };
        }

        // Prepare the update data with the correct structure
        // Magento 2 API requires a "product" wrapper object
        let updateData = {
          product: {}
        };

        // Determine if this is a standard attribute or custom attribute
        const isCustomAttribute = productData.custom_attributes &&
                                 productData.custom_attributes.some(attr => attr.attribute_code === attribute_code);

        if (isCustomAttribute) {
          // For custom attributes, we need to use the custom_attributes array
          updateData.product.custom_attributes = [
            {
              attribute_code,
              value
            }
          ];
        } else {
          // For standard attributes, we set them directly on the product object
          updateData.product[attribute_code] = value;
        }

        // Make the API call to update the product
        const result = await callMagentoApi(`/products/${sku}`, 'PUT', updateData);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated '${attribute_code}' for product with SKU '${sku}'. Updated product: ${JSON.stringify(formatProduct(result), null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating product attribute: ${error.response?.data?.message || error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Create simple product
  server.tool(
    "create_product",
    "Create a new product",
    {
      sku: z.string().describe("Product SKU (must be unique)"),
      name: z.string().describe("Product name"),
      price: z.number().describe("Product price"),
      attribute_set_id: z.number().optional().describe("Attribute set ID (default: 4 for Default)"),
      type_id: z.string().optional().describe("Product type: simple, configurable, grouped, virtual, bundle, downloadable (default: simple)"),
      status: z.number().optional().describe("Product status: 1=Enabled, 2=Disabled (default: 1)"),
      visibility: z.number().optional().describe("Visibility: 1=Not Visible, 2=Catalog, 3=Search, 4=Catalog,Search (default: 4)"),
      weight: z.number().optional().describe("Product weight"),
      description: z.string().optional().describe("Full product description"),
      short_description: z.string().optional().describe("Short product description"),
      meta_title: z.string().optional().describe("Meta title for SEO"),
      meta_description: z.string().optional().describe("Meta description for SEO"),
      url_key: z.string().optional().describe("URL key for the product")
    },
    async ({ sku, name, price, attribute_set_id = 4, type_id = 'simple', status = 1, visibility = 4, weight, description, short_description, meta_title, meta_description, url_key }) => {
      try {
        const productData = {
          product: {
            sku,
            name,
            price,
            attribute_set_id,
            type_id,
            status,
            visibility,
            custom_attributes: []
          }
        };

        if (weight !== undefined) productData.product.weight = weight;

        if (description) {
          productData.product.custom_attributes.push({ attribute_code: 'description', value: description });
        }
        if (short_description) {
          productData.product.custom_attributes.push({ attribute_code: 'short_description', value: short_description });
        }
        if (meta_title) {
          productData.product.custom_attributes.push({ attribute_code: 'meta_title', value: meta_title });
        }
        if (meta_description) {
          productData.product.custom_attributes.push({ attribute_code: 'meta_description', value: meta_description });
        }
        if (url_key) {
          productData.product.custom_attributes.push({ attribute_code: 'url_key', value: url_key });
        }

        const result = await callMagentoApi('/products', 'POST', productData);
        return {
          content: [{ type: "text", text: `Product created successfully:\n${JSON.stringify(formatProduct(result), null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating product: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update product
  server.tool(
    "update_product",
    "Update an existing product",
    {
      sku: z.string().describe("Product SKU"),
      name: z.string().optional().describe("New product name"),
      price: z.number().optional().describe("New product price"),
      status: z.number().optional().describe("Product status: 1=Enabled, 2=Disabled"),
      visibility: z.number().optional().describe("Visibility: 1=Not Visible, 2=Catalog, 3=Search, 4=Catalog,Search"),
      weight: z.number().optional().describe("Product weight"),
      description: z.string().optional().describe("Full product description"),
      short_description: z.string().optional().describe("Short product description")
    },
    async ({ sku, name, price, status, visibility, weight, description, short_description }) => {
      try {
        const productData = {
          product: {
            custom_attributes: []
          }
        };

        if (name !== undefined) productData.product.name = name;
        if (price !== undefined) productData.product.price = price;
        if (status !== undefined) productData.product.status = status;
        if (visibility !== undefined) productData.product.visibility = visibility;
        if (weight !== undefined) productData.product.weight = weight;

        if (description !== undefined) {
          productData.product.custom_attributes.push({ attribute_code: 'description', value: description });
        }
        if (short_description !== undefined) {
          productData.product.custom_attributes.push({ attribute_code: 'short_description', value: short_description });
        }

        const result = await callMagentoApi(`/products/${sku}`, 'PUT', productData);
        return {
          content: [{ type: "text", text: `Product updated successfully:\n${JSON.stringify(formatProduct(result), null, 2)}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating product: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete product
  server.tool(
    "delete_product",
    "Delete a product by SKU",
    {
      sku: z.string().describe("The SKU of the product to delete")
    },
    async ({ sku }) => {
      try {
        const result = await callMagentoApi(`/products/${sku}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Product ${sku} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting product: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Assign product to category
  server.tool(
    "assign_product_to_category",
    "Assign a product to a category",
    {
      category_id: z.number().describe("The ID of the category"),
      sku: z.string().describe("The SKU of the product"),
      position: z.number().optional().describe("Position in the category (default: 0)")
    },
    async ({ category_id, sku, position = 0 }) => {
      try {
        const linkData = {
          productLink: {
            sku,
            category_id,
            position
          }
        };

        const result = await callMagentoApi(`/categories/${category_id}/products`, 'POST', linkData);
        return {
          content: [{ type: "text", text: `Product ${sku} assigned to category ${category_id} successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error assigning product to category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Remove product from category
  server.tool(
    "remove_product_from_category",
    "Remove a product from a category",
    {
      category_id: z.number().describe("The ID of the category"),
      sku: z.string().describe("The SKU of the product to remove")
    },
    async ({ category_id, sku }) => {
      try {
        const result = await callMagentoApi(`/categories/${category_id}/products/${sku}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Product ${sku} removed from category ${category_id}. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error removing product from category: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}

export {
  registerProductTools
};
