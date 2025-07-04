import React, { useState, useEffect, useCallback } from 'react';
import { getStockReport } from '../api/products';
import ErrorDisplay from './ErrorDisplay';
import moment from 'moment'; // For date formatting

/**
 * Component to display a report of stock transactions.
 * Allows filtering transactions by a date range, now showing Product SKU details.
 */
const StockReport = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    //Fetches the stock report from the API based on current filter criteria.
    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            // Add start and end date parameters if they are set
            if (startDate) {
                params.transaction_date_gte = startDate; // Greater than or equal to start date
            }
            if (endDate) {
                params.transaction_date_lte = endDate;
            }

            const response = await getStockReport(params);
            console.log("API Response Data for Stock Report (with SKUs):", response.data); // For debugging

            // Access the 'results' array from the paginated response
            const dataToSet = Array.isArray(response.data.results) ? response.data.results : [];
            setTransactions(dataToSet);
        } catch (err) {
            console.error('Error fetching stock report:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]); // Re-run fetchReport when startDate or endDate changes

    // Effect hook to fetch the report when the component mounts and when filters change
    useEffect(() => {
        fetchReport();
    }, [fetchReport]); // Dependency on fetchReport

    /**
     * Handles applying the date filters.
     * Triggers a re-fetch of the report.
     */
    const handleFilter = () => {
        fetchReport();
    };

    // Render loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-lg text-gray-700">Loading stock report...</p>
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

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto my-8">
            <h2 className="text-3xl font-bold text-center text-blue-700 mb-6 pb-4 border-b-2 border-gray-200">Stock Report</h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
                <label htmlFor="startDate" className="text-gray-700 font-medium">Start Date:</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto w-full"
                />
                <label htmlFor="endDate" className="text-gray-700 font-medium">End Date:</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto w-full"
                />
                <button
                    onClick={handleFilter}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full sm:w-auto"
                >
                    Apply Filter
                </button>
            </div>

            {/* Display message if no transactions are found */}
            {transactions.length === 0 ? (
                <div className="text-center text-lg text-gray-600 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    No stock transactions found for the selected period.
                </div>
            ) : (
                <div className="overflow-x-auto"> {/* Added for horizontal scrolling on small screens */}
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 rounded-tl-lg">Date</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Product Name</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">SKU Code</th> {/* New */}
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">SKU Options</th> {/* New */}
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Type</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 rounded-tr-lg">Stock After</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transactions.map(transaction => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{moment(transaction.transaction_date).format('YYYY-MM-DD HH:mm:ss')}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{transaction.product_name}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{transaction.sku_code || 'N/A'}</td> {/* New */}
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{transaction.product_sku_options}</td> {/* New */}
                                    <td className={`py-3 px-4 whitespace-nowrap text-sm font-semibold ${transaction.transaction_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.transaction_type === 'IN' ? 'Stock In' : 'Stock Out'}
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{transaction.quantity}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{transaction.current_stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StockReport;
