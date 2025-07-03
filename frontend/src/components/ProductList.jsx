import React, { useEffect, useState, useCallback } from 'react';
import { getProducts } from '../api/products'; // Only getProducts needed here
import ErrorDisplay from './ErrorDisplay';

/**
 * Component to display a list of all available products.
 * Fetches product data from the backend and renders it in a card-like layout,
 * now showing individual Product SKUs and their stock.
 */
const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // REMOVED: categories state
    // REMOVED: filterCategoryId state

    // REMOVED: useEffect for fetching categories

    /**
     * Fetches products from the API.
     * Wrapped in useCallback to prevent unnecessary re-creations if passed as prop.
     */
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // REMOVED: params and filterCategoryId logic
            const response = await getProducts(); // No params passed if no filtering
            console.log("API Response Data for Product List (with SKUs):", response.data);

            const dataToSet = Array.isArray(response.data.results) ? response.data.results : [];
            setProducts(dataToSet);

        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []); // Removed filterCategoryId from dependency array

    // Effect hook to fetch products when the component mounts
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Render loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-lg text-gray-700">Loading products...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto my-8">
                <ErrorDisplay error={error} />
            </div>
        );
    }

    // Render message if no products are available (after loading and no errors)
    if (products.length === 0) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto my-8 text-center text-lg text-gray-600">
                No products available. Please create one using the "Create Product" link.
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-blue-700 mb-8 pb-4 border-b-2 border-gray-200">Product List</h2>
            
            {/* REMOVED: Category Filter JSX */}

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => (
                    <li key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:scale-105 duration-200 ease-in-out">
                        <h3 className="text-xl font-semibold text-blue-600 mb-3">{product.ProductName} ({product.ProductCode})</h3>
                        
                        {/* Display product image if available */}
                        {product.ProductImage ? (
                            <img
                                src={product.ProductImage}
                                alt={product.ProductName}
                                className="w-32 h-32 object-cover rounded-lg mb-4 shadow-md"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/128x128/e0e0e0/555555?text=No+Image'; }}
                            />
                        ) : (
                            <img
                                src="https://placehold.co/128x128/e0e0e0/555555?text=No+Image"
                                alt="No Image Available"
                                className="w-32 h-32 object-cover rounded-lg mb-4 shadow-md"
                            />
                        )}

                        {/* REMOVED: Display Category Name if available */}

                        {/* Display Total Stock from the computed property */}
                        <p className="text-gray-700 mb-4">
                            <strong className="font-medium">Total Stock:</strong> {product.TotalStock !== null ? product.TotalStock : 'N/A'}
                        </p>
                        
                        {/* Display Product SKUs if they exist */}
                        {product.product_skus && product.product_skus.length > 0 && (
                            <div className="w-full mt-4 pt-4 border-t border-dashed border-gray-300">
                                <h4 className="text-lg font-medium text-gray-700 mb-3">Product SKUs:</h4>
                                <div className="space-y-3">
                                    {product.product_skus.map(sku => (
                                        <div key={sku.id} className="bg-gray-50 p-3 rounded-md border border-gray-100 text-left">
                                            <p className="text-gray-800 font-semibold mb-1">
                                                SKU: {sku.sku_code || 'N/A'}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                Options: {sku.product_sku_options || 'N/A'}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                Stock: {sku.stock !== null ? sku.stock : 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProductList;
