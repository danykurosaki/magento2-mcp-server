import axios from 'axios';
import { MAGENTO_BASE_URL, MAGENTO_API_TOKEN, httpsAgent } from '../config.js';

/**
 * Make authenticated requests to Magento 2 API
 * @param {string} endpoint - API endpoint (e.g., '/products/SKU123')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object|null} data - Request body data
 * @returns {Promise<any>} API response data
 */
async function callMagentoApi(endpoint, method = 'GET', data = null) {
  try {
    const url = `${MAGENTO_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${MAGENTO_API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const config = {
      method,
      url,
      headers,
      data: data ? JSON.stringify(data) : undefined,
      httpsAgent
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Magento API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch all pages for a given search criteria
 * @param {string} endpoint - API endpoint
 * @param {string} baseSearchCriteria - Search criteria query string
 * @returns {Promise<Array>} All items from all pages
 */
async function fetchAllPages(endpoint, baseSearchCriteria) {
  const pageSize = 100;
  let currentPage = 1;
  let allItems = [];
  let totalCount = 0;

  do {
    // Build search criteria for the current page
    let currentPageSearchCriteria = baseSearchCriteria;
    if (!currentPageSearchCriteria.includes('searchCriteria[pageSize]')) {
      currentPageSearchCriteria += `&searchCriteria[pageSize]=${pageSize}`;
    }
    if (!currentPageSearchCriteria.includes('searchCriteria[currentPage]')) {
      currentPageSearchCriteria += `&searchCriteria[currentPage]=${currentPage}`;
    } else {
      currentPageSearchCriteria = currentPageSearchCriteria.replace(
        /searchCriteria\[currentPage\]=\d+/,
        `searchCriteria[currentPage]=${currentPage}`
      );
    }

    // Make the API call for the current page
    const responseData = await callMagentoApi(`${endpoint}?${currentPageSearchCriteria}`);

    if (responseData.items && Array.isArray(responseData.items)) {
      allItems = allItems.concat(responseData.items);
    }

    // Update total count (only needs to be set once)
    if (currentPage === 1) {
      totalCount = responseData.total_count || 0;
    }

    // Check if we need to fetch more pages
    if (totalCount <= allItems.length || !responseData.items || responseData.items.length < pageSize) {
      break;
    }

    currentPage++;

  } while (true);

  return allItems;
}

export {
  callMagentoApi,
  fetchAllPages
};
