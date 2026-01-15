import { z } from 'zod';
import { callMagentoApi, fetchAllPages } from '../utils/api-client.js';
import { parseDateExpression, buildDateRangeFilter, normalizeCountry } from '../utils/date-utils.js';
import { formatProduct } from '../utils/formatters.js';
import { format } from 'date-fns';

/**
 * Register all analytics/reporting tools with the MCP server
 * @param {object} server - MCP server instance
 */
function registerAnalyticsTools(server) {
  // Tool: Get revenue
  server.tool(
    "get_revenue",
    "Get the total revenue for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      include_tax: z.boolean().optional().describe("Whether to include tax in the revenue calculation (default: true)")
    },
    async ({ date_range, status, include_tax = true }) => {
      try {
        // Parse the date range expression
        const dateRange = parseDateExpression(date_range);

        // Build the search criteria for the date range
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);

        // Add status filter if provided
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }

        // Fetch all orders using the helper function
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        // Calculate total revenue
        let totalRevenue = 0;
        let totalTax = 0;
        let orderCount = 0;

        if (allOrders && Array.isArray(allOrders)) {
          orderCount = allOrders.length;

          allOrders.forEach(order => {
            // Use grand_total which includes tax, shipping, etc.
            totalRevenue += parseFloat(order.grand_total || 0);

            // Track tax separately
            totalTax += parseFloat(order.tax_amount || 0);
          });
        }

        // Adjust revenue if tax should be excluded
        const revenueWithoutTax = totalRevenue - totalTax;
        const finalRevenue = include_tax ? totalRevenue : revenueWithoutTax;

        // Format the response
        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            include_tax: include_tax,
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            revenue: parseFloat(finalRevenue.toFixed(2)),
            currency: 'USD', // This should be dynamically determined from the store configuration
            order_count: orderCount,
            average_order_value: orderCount > 0 ? parseFloat((finalRevenue / orderCount).toFixed(2)) : 0,
            tax_amount: parseFloat(totalTax.toFixed(2))
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching revenue: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Get order count
  server.tool(
    "get_order_count",
    "Get the number of orders for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')")
    },
    async ({ date_range, status }) => {
      try {
        // Parse the date range expression
        const dateRange = parseDateExpression(date_range);

        // Build the search criteria for the date range
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);

        // Add status filter if provided
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }

        // Add pagination to get all results
        searchCriteria += `&searchCriteria[pageSize]=1&searchCriteria[currentPage]=1`;

        // Make the API call to get orders
        const ordersData = await callMagentoApi(`/orders?${searchCriteria}`);

        // Format the response
        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            order_count: ordersData.total_count || 0
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching order count: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Get product sales
  server.tool(
    "get_product_sales",
    "Get statistics about the quantity of products sold in a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      country: z.string().optional().describe("Filter by country code (e.g., 'US', 'NL', 'GB') or country name (e.g., 'United States', 'The Netherlands', 'United Kingdom')")
    },
    async ({ date_range, status, country }) => {
      try {
        // Parse the date range expression
        const dateRange = parseDateExpression(date_range);

        // Build the search criteria for the date range
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);

        // Add status filter if provided
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }

        // Fetch all orders using the helper function
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        // Filter orders by country if provided
        let filteredOrders = allOrders;
        if (country) {
          // Normalize country input
          const normalizedCountry = normalizeCountry(country);

          // Filter orders by country
          filteredOrders = filteredOrders.filter(order => {
            // Check billing address country
            const billingCountry = order.billing_address?.country_id;

            // Check shipping address country
            const shippingCountry = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address?.country_id;

            // Match if either billing or shipping country matches
            return normalizedCountry.includes(billingCountry) || normalizedCountry.includes(shippingCountry);
          });
        }

        // Calculate statistics
        let totalOrders = filteredOrders.length;
        let totalOrderItems = 0;
        let totalProductQuantity = 0;
        let totalRevenue = 0;
        let productCounts = {};

        if (filteredOrders && Array.isArray(filteredOrders)) {
          filteredOrders.forEach(order => {
            // Add to total revenue
            totalRevenue += parseFloat(order.grand_total || 0);

            // Process order items
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                totalOrderItems++;
                const quantity = parseFloat(item.qty_ordered || 0);
                totalProductQuantity += quantity;

                // Track product counts
                if (!productCounts[item.sku]) {
                  productCounts[item.sku] = {
                    sku: item.sku,
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                  };
                }

                productCounts[item.sku].quantity += quantity;
                productCounts[item.sku].revenue += parseFloat(item.price || 0) * quantity;
              });
            }
          });
        }

        // Get top 10 products by quantity
        const topProducts = Object.values(productCounts)
          .map(product => ({
            sku: product.sku,
            name: product.name,
            quantity: product.quantity,
            revenue: parseFloat(product.revenue.toFixed(2))
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10); // Top 10 products

        // Format the response
        const result = {
          query: {
            date_range: dateRange.description,
            status: status || 'All',
            country: country || 'All',
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            total_orders: totalOrders,
            total_order_items: totalOrderItems,
            total_product_quantity: totalProductQuantity,
            average_products_per_order: totalOrders > 0 ? parseFloat((totalProductQuantity / totalOrders).toFixed(2)) : 0,
            total_revenue: parseFloat(totalRevenue.toFixed(2)),
            average_revenue_per_product: totalProductQuantity > 0 ? parseFloat((totalRevenue / totalProductQuantity).toFixed(2)) : 0,
            top_products: topProducts
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching product sales: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Get revenue by country
  server.tool(
    "get_revenue_by_country",
    "Get revenue filtered by country for a given date range",
    {
      date_range: z.string().describe("Date range expression (e.g., 'today', 'yesterday', 'last week', 'this month', 'YTD', or a specific date range like '2023-01-01 to 2023-01-31')"),
      country: z.string().describe("Country code (e.g., 'US', 'NL', 'GB') or country name (e.g., 'United States', 'The Netherlands', 'United Kingdom')"),
      status: z.string().optional().describe("Filter by order status (e.g., 'processing', 'complete', 'pending')"),
      include_tax: z.boolean().optional().describe("Whether to include tax in the revenue calculation (default: true)")
    },
    async ({ date_range, country, status, include_tax = true }) => {
      try {
        // Parse the date range expression
        const dateRange = parseDateExpression(date_range);

        // Normalize country input (handle both country codes and names)
        const normalizedCountry = normalizeCountry(country);

        // Build the search criteria for the date range
        let searchCriteria = buildDateRangeFilter('created_at', dateRange.startDate, dateRange.endDate);

        // Add status filter if provided
        if (status) {
          searchCriteria += `&searchCriteria[filter_groups][2][filters][0][field]=status&` +
                            `searchCriteria[filter_groups][2][filters][0][value]=${encodeURIComponent(status)}&` +
                            `searchCriteria[filter_groups][2][filters][0][condition_type]=eq`;
        }

        // Fetch all orders using the helper function
        const allOrders = await fetchAllPages('/orders', searchCriteria);

        // Filter orders by country and calculate revenue
        let totalRevenue = 0;
        let totalTax = 0;
        let orderCount = 0;
        let filteredOrders = [];

        if (allOrders && Array.isArray(allOrders)) {
          // Filter orders by country
          filteredOrders = allOrders.filter(order => {
            // Check billing address country
            const billingCountry = order.billing_address?.country_id;

            // Check shipping address country
            const shippingCountry = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address?.country_id;

            // Match if either billing or shipping country matches
            return normalizedCountry.includes(billingCountry) || normalizedCountry.includes(shippingCountry);
          });

          orderCount = filteredOrders.length;

          // Calculate revenue for filtered orders
          filteredOrders.forEach(order => {
            totalRevenue += parseFloat(order.grand_total || 0);
            totalTax += parseFloat(order.tax_amount || 0);
          });
        }

        // Adjust revenue if tax should be excluded
        const revenueWithoutTax = totalRevenue - totalTax;
        const finalRevenue = include_tax ? totalRevenue : revenueWithoutTax;

        // Format the response
        const result = {
          query: {
            date_range: dateRange.description,
            country: country,
            normalized_country: normalizedCountry.join(', '),
            status: status || 'All',
            include_tax: include_tax,
            period: {
              start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
              end_date: format(dateRange.endDate, 'yyyy-MM-dd')
            }
          },
          result: {
            revenue: parseFloat(finalRevenue.toFixed(2)),
            currency: 'USD', // This should be dynamically determined from the store configuration
            order_count: orderCount,
            average_order_value: orderCount > 0 ? parseFloat((finalRevenue / orderCount).toFixed(2)) : 0,
            tax_amount: parseFloat(totalTax.toFixed(2))
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching revenue by country: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Tool: Get customer ordered products by email
  server.tool(
    "get_customer_ordered_products_by_email",
    "Get all ordered products for a customer by email address",
    {
      email: z.string().email().describe("The email address of the customer")
    },
    async ({ email }) => {
      try {
        // Step 1: Find the customer by email
        const searchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=email&` +
                              `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(email)}&` +
                              `searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

        const customersData = await callMagentoApi(`/customers/search?${searchCriteria}`);

        if (!customersData.items || customersData.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No customer found with email: ${email}`
              }
            ]
          };
        }

        const customer = customersData.items[0];

        // Step 2: Get the customer's orders
        const orderSearchCriteria = `searchCriteria[filter_groups][0][filters][0][field]=customer_email&` +
                                   `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(email)}&` +
                                   `searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;

        // Fetch all orders for the customer using the helper function
        const allCustomerOrders = await fetchAllPages('/orders', orderSearchCriteria);

        if (!allCustomerOrders || allCustomerOrders.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No orders found for customer with email: ${email}`
              }
            ]
          };
        }

        // Step 3: Extract and format the ordered products
        const orderedProducts = [];
        const productSkus = new Set();

        // First, collect all unique product SKUs from all orders
        allCustomerOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (item.sku) {
                productSkus.add(item.sku);
              }
            });
          }
        });

        // Get detailed product information for each SKU
        const productPromises = Array.from(productSkus).map(sku =>
          callMagentoApi(`/products/${sku}`)
            .then(product => formatProduct(product))
            .catch(err => ({ sku, error: err.message }))
        );

        const productDetails = await Promise.all(productPromises);

        // Create a map of SKU to product details for easy lookup
        const productMap = {};
        productDetails.forEach(product => {
          if (product.sku) {
            productMap[product.sku] = product;
          }
        });

        // Format the result with order information and product details
        const result = {
          customer: {
            id: customer.id,
            email: customer.email,
            firstname: customer.firstname,
            lastname: customer.lastname
          },
          orders: allCustomerOrders.map(order => ({
            order_id: order.entity_id,
            increment_id: order.increment_id,
            created_at: order.created_at,
            status: order.status,
            total: order.grand_total,
            items: order.items.map(item => {
              const productDetail = productMap[item.sku] || {};
              return {
                sku: item.sku,
                name: item.name,
                price: item.price,
                qty_ordered: item.qty_ordered,
                product_details: productDetail
              };
            })
          }))
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching customer ordered products: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
}

export {
  registerAnalyticsTools
};
