import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register product media tools
 * @param {Object} server - MCP server instance
 */
export function registerMediaTools(server) {
  // ==========================================
  // PRODUCT MEDIA TOOLS
  // ==========================================

  // Tool: Get product media
  server.tool(
    "get_product_media",
    "Get all media (images, videos) for a product",
    {
      sku: z.string().describe("The SKU of the product")
    },
    async ({ sku }) => {
      try {
        const media = await callMagentoApi(`/products/${sku}/media`);
        return {
          content: [{ type: "text", text: JSON.stringify(media, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching product media: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get product media entry
  server.tool(
    "get_product_media_entry",
    "Get a specific media entry for a product",
    {
      sku: z.string().describe("The SKU of the product"),
      entry_id: z.number().describe("The ID of the media entry")
    },
    async ({ sku, entry_id }) => {
      try {
        const media = await callMagentoApi(`/products/${sku}/media/${entry_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(media, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching media entry: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Add product image
  server.tool(
    "add_product_image",
    "Add an image to a product from base64 data",
    {
      sku: z.string().describe("The SKU of the product"),
      image_base64: z.string().describe("Base64 encoded image data"),
      image_type: z.string().optional().describe("Image MIME type (default: image/jpeg)"),
      image_name: z.string().describe("Image filename (e.g., 'product-image.jpg')"),
      label: z.string().optional().describe("Image alt text/label"),
      position: z.number().optional().describe("Sort position (default: 0)"),
      types: z.array(z.string()).optional().describe("Image types: image, small_image, thumbnail, swatch_image"),
      disabled: z.boolean().optional().describe("Whether image is hidden (default: false)")
    },
    async ({ sku, image_base64, image_type = 'image/jpeg', image_name, label, position = 0, types = [], disabled = false }) => {
      try {
        const mediaData = {
          entry: {
            media_type: 'image',
            label: label || image_name,
            position,
            disabled,
            types,
            content: {
              base64_encoded_data: image_base64,
              type: image_type,
              name: image_name
            }
          }
        };

        const result = await callMagentoApi(`/products/${sku}/media`, 'POST', mediaData);
        return {
          content: [{ type: "text", text: `Image added successfully. Entry ID: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error adding image: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Update product media
  server.tool(
    "update_product_media",
    "Update a product media entry",
    {
      sku: z.string().describe("The SKU of the product"),
      entry_id: z.number().describe("The ID of the media entry to update"),
      label: z.string().optional().describe("New label/alt text"),
      position: z.number().optional().describe("New sort position"),
      types: z.array(z.string()).optional().describe("New image types"),
      disabled: z.boolean().optional().describe("Whether image is hidden")
    },
    async ({ sku, entry_id, label, position, types, disabled }) => {
      try {
        const mediaData = { entry: { id: entry_id } };

        if (label !== undefined) mediaData.entry.label = label;
        if (position !== undefined) mediaData.entry.position = position;
        if (types !== undefined) mediaData.entry.types = types;
        if (disabled !== undefined) mediaData.entry.disabled = disabled;

        const result = await callMagentoApi(`/products/${sku}/media/${entry_id}`, 'PUT', mediaData);
        return {
          content: [{ type: "text", text: `Media updated successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error updating media: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Delete product media
  server.tool(
    "delete_product_media",
    "Delete a product media entry",
    {
      sku: z.string().describe("The SKU of the product"),
      entry_id: z.number().describe("The ID of the media entry to delete")
    },
    async ({ sku, entry_id }) => {
      try {
        const result = await callMagentoApi(`/products/${sku}/media/${entry_id}`, 'DELETE');
        return {
          content: [{ type: "text", text: `Media entry ${entry_id} deleted successfully. Result: ${result}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error deleting media: ${error.response?.data?.message || error.message}` }],
          isError: true
        };
      }
    }
  );
}
