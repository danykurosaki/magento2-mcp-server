import { z } from 'zod';
import { callMagentoApi } from '../utils/api-client.js';

/**
 * Register store configuration tools
 * @param {Object} server - MCP server instance
 */
export function registerStoreTools(server) {
  // ==========================================
  // STORE CONFIGURATION TOOLS
  // ==========================================

  // Tool: Get store configurations
  server.tool(
    "get_store_configs",
    "Get store configuration settings",
    {},
    async () => {
      try {
        const configs = await callMagentoApi('/store/storeConfigs');
        return {
          content: [{ type: "text", text: JSON.stringify(configs, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching store configs: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get store views
  server.tool(
    "get_store_views",
    "Get all store views",
    {},
    async () => {
      try {
        const storeViews = await callMagentoApi('/store/storeViews');
        return {
          content: [{ type: "text", text: JSON.stringify(storeViews, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching store views: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get websites
  server.tool(
    "get_websites",
    "Get all websites",
    {},
    async () => {
      try {
        const websites = await callMagentoApi('/store/websites');
        return {
          content: [{ type: "text", text: JSON.stringify(websites, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching websites: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get store groups
  server.tool(
    "get_store_groups",
    "Get all store groups",
    {},
    async () => {
      try {
        const groups = await callMagentoApi('/store/storeGroups');
        return {
          content: [{ type: "text", text: JSON.stringify(groups, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching store groups: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get countries
  server.tool(
    "get_countries",
    "Get list of available countries",
    {},
    async () => {
      try {
        const countries = await callMagentoApi('/directory/countries');
        return {
          content: [{ type: "text", text: JSON.stringify(countries, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching countries: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Get currency information
  server.tool(
    "get_currency_info",
    "Get currency information and exchange rates",
    {},
    async () => {
      try {
        const currency = await callMagentoApi('/directory/currency');
        return {
          content: [{ type: "text", text: JSON.stringify(currency, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching currency info: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
