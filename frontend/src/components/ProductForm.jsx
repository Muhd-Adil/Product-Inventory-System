import React, { useState, useEffect, useCallback } from 'react';
import { createProduct } from '../api/products'; 
import ErrorDisplay from './ErrorDisplay';

/**
 * Component for creating a new product with variants and sub-variants,
 * and defining initial stock for generated Product SKUs.
 */
const ProductForm = () => {
    // State variables for product details
    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [hsnCode, setHsnCode] = useState('');
    const [image, setImage] = useState(null);
    const [isActive, setIsActive] = useState(true);

    // State for managing dynamic variants and their options (sub-variants)
    const [variants, setVariants] = useState([{ name: '', options: [''] }]);

    // State to hold the dynamically generated Product SKUs and their initial stock
    const [generatedSkus, setGeneratedSkus] = useState([]);

    // UI feedback states
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState(null);

    /**
     * Generates all possible combinations of sub-variants to form Product SKUs.
     * This function is called whenever variants or their options change.
     */
    const generateProductSKUs = useCallback(() => {
        const validVariants = variants.filter(
            (v) => v.name.trim() !== '' && v.options.filter(Boolean).length > 0
        );

        if (validVariants.length === 0) {
            setGeneratedSkus([]);
            return;
        }

        const variantOptionSets = validVariants.map((v) =>
            v.options.filter(Boolean).map((opt) => ({
                variantName: v.name.trim(),
                option: opt.trim(),
            }))
        );

        const combinations = (sets) => {
            if (sets.length === 0) return [[]];
            const firstSet = sets[0];
            const restOfSets = sets.slice(1);

            const restCombinations = combinations(restOfSets);
            const result = [];

            firstSet.forEach((item) => {
                restCombinations.forEach((restComb) => {
                    result.push([item, ...restComb]);
                });
            });
            return result;
        };

        const allCombinations = combinations(variantOptionSets);

        setGeneratedSkus((prevSkus) => {
            const newSkus = allCombinations.map((combo) => {
                const sortedCombo = [...combo].sort((a, b) => 
                    a.variantName.localeCompare(b.variantName) || a.option.localeCompare(b.option)
                );
                const comboKey = JSON.stringify(sortedCombo.map(item => `${item.variantName}:${item.option}`));
                
                const existingSku = prevSkus.find(prevSku => {
                    const prevSortedCombo = [...prevSku.options].sort((a, b) => 
                        a.variantName.localeCompare(b.variantName) || a.option.localeCompare(b.option)
                    );
                    return JSON.stringify(prevSortedCombo.map(item => `${item.variantName}:${item.option}`)) === comboKey;
                });

                return {
                    options: sortedCombo,
                    stock: existingSku ? existingSku.stock : 0,
                };
            });
            return newSkus;
        });

    }, [variants]);

    useEffect(() => {
        generateProductSKUs();
    }, [generateProductSKUs]);

    const handleVariantNameChange = (index, value) => {
        const newVariants = [...variants];
        newVariants[index].name = value;
        setVariants(newVariants);
    };

    const handleOptionChange = (variantIndex, optionIndex, value) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options[optionIndex] = value;
        setVariants(newVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { name: '', options: [''] }]);
    };

    const addOption = (variantIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options.push('');
        setVariants(newVariants);
    };

    const removeVariant = (index) => {
        const newVariants = variants.filter((_, i) => i !== index);
        setVariants(newVariants);
    };

    const removeOption = (variantIndex, optionIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].options = newVariants[variantIndex].options.filter((_, i) => i !== optionIndex);
        setVariants(newVariants);
    };

    const handleSkuStockChange = (skuIndex, value) => {
        const newGeneratedSkus = [...generatedSkus];
        newGeneratedSkus[skuIndex].stock = value === '' ? '' : parseFloat(value) || 0; 
        setGeneratedSkus(newGeneratedSkus);
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setError(null);

        if (!productName.trim() || !productCode.trim()) {
            setError("Product Name and Product Code are required.");
            setLoading(false);
            return;
        }

        const hasInvalidStock = generatedSkus.some(sku => {
            const stockValue = parseFloat(sku.stock);
            return isNaN(stockValue) || stockValue < 0;
        });
        if (hasInvalidStock) {
            setError("All SKU stock values must be non-negative numbers.");
            setLoading(false);
            return;
        }

        const formattedVariants = variants.map(variant => ({
            name: variant.name.trim(),
            sub_variants: variant.options.filter(Boolean).map(option => ({ option: option.trim() }))
        })).filter(variant => variant.name && variant.sub_variants.length > 0);

        const initialProductSkusPayload = generatedSkus.map(sku => ({
            options: sku.options.map(o => o.option),
            stock: parseFloat(sku.stock) || 0,
        }));

        let payload;

        if (image) {
            payload = new FormData();
            payload.append('ProductName', productName.trim());
            payload.append('ProductCode', productCode.trim());
            if (hsnCode.trim()) payload.append('HSNCode', hsnCode.trim());
            payload.append('ProductImage', image);
            payload.append('variants_json', JSON.stringify(formattedVariants));
            payload.append('initial_product_skus_json', JSON.stringify(initialProductSkusPayload));
            payload.append('Active', isActive);
        } else {
            payload = {
                ProductName: productName.trim(),
                ProductCode: productCode.trim(),
                HSNCode: hsnCode.trim() || null,
                variants: formattedVariants,
                initial_product_skus: initialProductSkusPayload,
                Active: isActive,
            };
        }

        console.log("Payload being sent to API:", payload);

        try {
            const response = await createProduct(payload);
            setSuccessMessage(`Product '${response.data.ProductName}' created successfully!`);
            // Reset form fields after successful submission
            setProductName('');
            setProductCode('');
            setHsnCode('');
            setImage(null);
            setIsActive(true);
            // REMOVED: setSelectedCategoryId('');
            setVariants([{ name: '', options: [''] }]);
            setGeneratedSkus([]);
            console.log('Product created:', response.data);
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-blue-700 mb-6 pb-4 border-b-2 border-gray-200">Create New Product</h2>
            
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4">
                    {successMessage}
                </div>
            )}
            <ErrorDisplay error={error} />
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Basic Details */}
                <div className="mb-4">
                    <label htmlFor="productName" className="block text-gray-700 text-sm font-bold mb-2">Product Name:</label>
                    <input
                        type="text"
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="productCode" className="block text-gray-700 text-sm font-bold mb-2">Product Code:</label>
                    <input
                        type="text"
                        id="productCode"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="hsnCode" className="block text-gray-700 text-sm font-bold mb-2">HSN Code (Optional):</label>
                    <input
                        type="text"
                        id="hsnCode"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="productImage" className="block w-full text-gray-700 text-sm font-bold mb-2">Product Image (Optional):</label>
                    <input
                        type="file"
                        id="productImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Active checkbox */}
                <div className="mb-6 flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded-md focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-gray-700 text-sm font-bold">Is Active?</label>
                </div>

                {/* Product Variants Definition */}
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Define Product Variants:</h3>
                {variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="bg-blue-50 p-6 rounded-lg shadow-inner border border-dashed border-blue-200 mb-6">
                        <div className="flex flex-col sm:flex-row items-center mb-4 gap-4">
                            <input
                                type="text"
                                placeholder="Variant Name (e.g., size, color)"
                                value={variant.name}
                                onChange={(e) => handleVariantNameChange(variantIndex, e.target.value)}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {variants.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeVariant(variantIndex)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full sm:w-auto"
                                >
                                    Remove Variant
                                </button>
                            )}
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="text-lg font-medium text-gray-700 mb-3">Options for "{variant.name || 'this variant'}":</h4>
                            <div className="space-y-3">
                                {variant.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex flex-col sm:flex-row items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Option (e.g., S, Red)"
                                            value={option}
                                            onChange={(e) => handleOptionChange(variantIndex, optionIndex, e.target.value)}
                                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                        {variant.options.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(variantIndex, optionIndex)}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline text-sm transition duration-150 ease-in-out w-full sm:w-auto"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => addOption(variantIndex)}
                                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                            >
                                Add Option
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addVariant}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full"
                >
                    Add New Variant Type
                </button>

                {/* Dynamically Generated Product SKUs and Initial Stock */}
                {generatedSkus.length > 0 && (
                    <div className="mt-8 pt-6 border-t-2 border-gray-200">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Set Initial Stock for Product SKUs:</h3>
                        <div className="space-y-4">
                            {generatedSkus.map((sku, skuIndex) => (
                                <div key={skuIndex} className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="text-gray-700 font-medium flex-1">
                                        {sku.options.map(o => `${o.variantName}: ${o.option}`).join(', ')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Initial Stock"
                                        value={sku.stock}
                                        onChange={(e) => handleSkuStockChange(skuIndex, e.target.value)}
                                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-xl mt-8"
                >
                    {loading ? 'Creating Product...' : 'Create Product'}
                </button>
            </form>
        </div>
    );
};

export default ProductForm;
