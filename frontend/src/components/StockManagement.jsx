import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, addStock, removeStock } from '../api/products';
import ErrorDisplay from './ErrorDisplay';

/**
 * Component for managing stock levels (adding or removing) for specific Product SKUs.
 * Allows selecting a product, then a specific Product SKU, and entering a quantity.
 */
const StockManagement = () => {
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedProductSkuId, setSelectedProductSkuId] = useState('');
    const [quantity, setQuantity] = useState('');

    // UI feedback states
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState(null);

    /**
     * Fetches the list of products to populate the dropdowns.
     * Wrapped in useCallback for memoization.
     */
    const fetchProductsForManagement = useCallback(async () => {
        try {
            const response = await getProducts();
            console.log("API Response Data for Stock Management Products (with SKUs):", response.data); // For debugging
            const dataToSet = Array.isArray(response.data.results) ? response.data.results : [];
            setProducts(dataToSet);
        } catch (err) {
            console.error('Error fetching products for stock management:', err);
            setError(err);
        }
    }, []);

    // Effect hook to fetch products when the component mounts
    useEffect(() => {
        fetchProductsForManagement();
    }, [fetchProductsForManagement]);

    /**
     * Handles the change event for the product selection dropdown.
     * Resets the selected Product SKU when a new product is chosen.
     * @param {Object} e - The event object.
     */
    const handleProductChange = (e) => {
        setSelectedProductId(e.target.value);
        setSelectedProductSkuId(''); // Reset Product SKU when product changes
    };

    // Find the currently selected product object from the `products` array
    const currentProduct = products.find(p => p.id === selectedProductId);

    // Get all Product SKUs for the selected product
    // Ensure product_skus is an array, even if empty or null from backend
    const availableProductSkus = currentProduct && Array.isArray(currentProduct.product_skus)
        ? currentProduct.product_skus
        : [];

    /**
     * Handles the stock addition or removal action.
     * @param {'add' | 'remove'} actionType - Specifies whether to add or remove stock.
     */
    const handleStockAction = async (actionType) => {
        setLoading(true);
        setSuccessMessage('');
        setError(null);

        // Client-side validation
        if (!selectedProductId || !selectedProductSkuId || !quantity) {
            setError("Please select a product, product SKU, and enter a quantity.");
            setLoading(false);
            return;
        }

        const qtyNum = parseFloat(quantity);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            setError("Quantity must be a positive number.");
            setLoading(false);
            return;
        }

        const data = {
            product_id: selectedProductId,
            product_sku_id: selectedProductSkuId,
            quantity: qtyNum,
        };

        try {
            let response;
            if (actionType === 'add') {
                response = await addStock(data);
                setSuccessMessage(`Successfully added ${qtyNum} to stock!`);
            } else { // 'remove'
                response = await removeStock(data);
                setSuccessMessage(`Successfully removed ${qtyNum} from stock!`);
            }
            console.log('Stock action response:', response.data);

            // After a successful action, re-fetch products to update displayed stock levels
            await fetchProductsForManagement();

            setQuantity(''); // Clear quantity input after successful action
        } catch (err) {
            console.error(`Error ${actionType}ing stock:`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-blue-700 mb-6 pb-4 border-b-2 border-gray-200">Stock Management</h2>
            
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4">
                    {successMessage}
                </div>
            )}
            <ErrorDisplay error={error} />

            <div className="space-y-6">
                <div className="mb-4">
                    <label htmlFor="productSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Product:</label>
                    <select
                        id="productSelect"
                        value={selectedProductId}
                        onChange={handleProductChange}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">-- Select a Product --</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.ProductName} ({product.ProductCode})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Only show Product SKU selection if a product is selected */}
                {selectedProductId && (
                    <div className="mb-4">
                        <label htmlFor="productSkuSelect" className="block text-gray-700 text-sm font-bold mb-2">Select Product SKU:</label>
                        <select
                            id="productSkuSelect"
                            value={selectedProductSkuId}
                            onChange={(e) => setSelectedProductSkuId(e.target.value)}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">-- Select a Product SKU --</option>
                            {availableProductSkus.map(sku => (
                                <option key={sku.id} value={sku.id}>
                                    {sku.product_sku_options} (SKU: {sku.sku_code || 'N/A'}) (Current Stock: {sku.stock !== null ? sku.stock : 'N/A'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
                    <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        step="any" // Allows decimal quantities
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>

                <div className="flex justify-center gap-4 mt-8">
                    <button
                        onClick={() => handleStockAction('add')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-lg flex-1"
                    >
                        {loading ? 'Adding...' : 'Add Stock (Purchase)'}
                    </button>
                    <button
                        onClick={() => handleStockAction('remove')}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-lg flex-1"
                    >
                        {loading ? 'Removing...' : 'Remove Stock (Sale)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockManagement;
