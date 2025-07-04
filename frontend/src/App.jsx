import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import StockManagement from './components/StockManagement';
import StockReport from './components/StockReport';
import './styles/App.css'; // Import global styles

function App() {
    return (
        <Router>
            <div className="App">
                {/* Navigation bar */}
                <nav className="navbar">
                    <ul>
                        <li><Link to="/">Product List</Link></li>
                        <li><Link to="/create-product">Create Product</Link></li>
                        <li><Link to="/stock-management">Stock Management</Link></li>
                        <li><Link to="/stock-report">Stock Report</Link></li>
                    </ul>
                </nav>

                <div className="container">
                    <Routes>
                        <Route path="/" element={<ProductList />} />
                        <Route path="/create-product" element={<ProductForm />} />
                        <Route path="/stock-management" element={<StockManagement />} />
                        <Route path="/stock-report" element={<StockReport />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;