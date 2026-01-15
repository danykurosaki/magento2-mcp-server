#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import tool registration functions
import { registerProductTools } from './src/tools/products.js';
import { registerCategoryTools } from './src/tools/categories.js';
import { registerCustomerTools } from './src/tools/customers.js';
import { registerOrderTools } from './src/tools/orders.js';
import { registerAnalyticsTools } from './src/tools/analytics.js';
import { registerInvoiceTools } from './src/tools/invoices.js';
import { registerShipmentTools } from './src/tools/shipments.js';
import { registerCreditmemoTools } from './src/tools/creditmemos.js';
import { registerStockTools } from './src/tools/stock.js';
import { registerCartTools } from './src/tools/carts.js';
import { registerCmsTools } from './src/tools/cms.js';
import { registerStoreTools } from './src/tools/store.js';
import { registerAttributeTools } from './src/tools/attributes.js';
import { registerMediaTools } from './src/tools/media.js';
import { registerPromotionTools } from './src/tools/promotions.js';
import { registerUrlRewriteTools } from './src/tools/url-rewrites.js';
import { registerTaxTools } from './src/tools/tax.js';

// Create an MCP server
const server = new McpServer({
  name: "magento-mcp-server",
  version: "2.0.0"
});

// Register all tools
console.error('Registering Product tools...');
registerProductTools(server);

console.error('Registering Category tools...');
registerCategoryTools(server);

console.error('Registering Customer tools...');
registerCustomerTools(server);

console.error('Registering Order tools...');
registerOrderTools(server);

console.error('Registering Analytics tools...');
registerAnalyticsTools(server);

console.error('Registering Invoice tools...');
registerInvoiceTools(server);

console.error('Registering Shipment tools...');
registerShipmentTools(server);

console.error('Registering Credit Memo tools...');
registerCreditmemoTools(server);

console.error('Registering Stock tools...');
registerStockTools(server);

console.error('Registering Cart tools...');
registerCartTools(server);

console.error('Registering CMS tools...');
registerCmsTools(server);

console.error('Registering Store tools...');
registerStoreTools(server);

console.error('Registering Attribute tools...');
registerAttributeTools(server);

console.error('Registering Media tools...');
registerMediaTools(server);

console.error('Registering Promotion tools...');
registerPromotionTools(server);

console.error('Registering URL Rewrite tools...');
registerUrlRewriteTools(server);

console.error('Registering Tax tools...');
registerTaxTools(server);

// Start the MCP server with stdio transport
async function main() {
  try {
    console.error('Starting Magento MCP Server...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Magento MCP Server running on stdio');
    console.error('All tools registered successfully!');
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
