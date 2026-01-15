/**
 * Format product data for better readability
 * @param {object} product - Raw product object from Magento API
 * @returns {object|string} Formatted product data
 */
function formatProduct(product) {
  if (!product) return "Product not found";

  // Extract custom attributes into a more readable format
  const customAttributes = {};
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    product.custom_attributes.forEach(attr => {
      customAttributes[attr.attribute_code] = attr.value;
    });
  }

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    status: product.status,
    visibility: product.visibility,
    type_id: product.type_id,
    created_at: product.created_at,
    updated_at: product.updated_at,
    extension_attributes: product.extension_attributes,
    custom_attributes: customAttributes
  };
}

/**
 * Format search results for better readability
 * @param {object} results - Raw search results from Magento API
 * @returns {object|string} Formatted search results
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

export {
  formatProduct,
  formatSearchResults
};
