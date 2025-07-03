import React from 'react';

/**
 * A reusable component to display user-friendly error messages.
 * It attempts to extract a meaningful error message from various error object structures.
 * @param {Object} props - The component props.
 * @param {any} props.error - The error object or string to display.
 */
const ErrorDisplay = ({ error }) => {
    // If no error is provided, render nothing.
    if (!error) return null;

    let errorMessage = "An unknown error occurred.";

    // Try to extract a specific message based on the error structure.
    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.response && error.response.data) {
        // Axios error with a response from the server
        if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
        } else {
            // If it's an object but no specific error key, stringify the whole object
            errorMessage = JSON.stringify(error.response.data);
        }
    } else if (error.message) {
        // Generic JavaScript error object
        errorMessage = error.message;
    }

    return (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', margin: '10px 0', borderRadius: '5px', backgroundColor: '#ffe6e6' }}>
            <strong>Error:</strong> {errorMessage}
        </div>
    );
};

export default ErrorDisplay;