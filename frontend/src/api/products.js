import axios from 'axios';

// Define the base URL for your Django backend API
const API_BASE_URL = 'http://localhost:8000/api'; // IMPORTANT: Change this if your backend runs on a different host/port

/**
 * Create an Axios instance with a base URL and default headers.
 * This simplifies API calls and centralizes configuration.
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json', // Default content type for most requests
    },
});

/**
 * API function to create a new product.
 * @param {Object} productData - The data for the new product, including variants.
 * This function handles sending FormData if an image is present.
 * @returns {Promise} A promise that resolves with the API response.
 */
export const createProduct = (productData) => {
    // Check if productData contains an image file.
    if (productData instanceof FormData) {
        return api.post('/products/create/', productData, {
            headers: {
                'Content-Type': 'multipart/form-data' // Required for file uploads
            }
        });
    } else {
        return api.post('/products/create/', productData);
    }
};

/**
 * API function to fetch a list of all products.
 * @returns {Promise} A promise that resolves with the list of products.
 */
export const getProducts = () => api.get('/products/');

/**
 * API function to add stock for a specific product sub-variant.
 * @param {Object} data - Contains product_id, sub_variant_id, and quantity.
 * @returns {Promise} A promise that resolves with the API response.
 */
export const addStock = (data) => api.post('/stock/add/', data);

/**
 * API function to remove stock for a specific product sub-variant.
  @param {Object} data - Contains product_id, sub_variant_id, and quantity.
 * @returns {Promise} A promise that resolves with the API response.
 */
export const removeStock = (data) => api.post('/stock/remove/', data);

/**
 * API function to fetch the stock transaction report.
 * @param {Object} params - Query parameters for filtering (e.g., transaction_date_gte, transaction_date_lte).
 * @returns {Promise} A promise that resolves with the stock transactions.
 */
export const getStockReport = (params) => api.get('/stock/report/', { params });
