// Updated content for app.js

// Function to compare market and vendor prices
function comparePrices(marketPrice, vendorPrice) {
    if (marketPrice < vendorPrice) {
        console.log('Market price is lower than vendor price.');
    } else if (marketPrice > vendorPrice) {
        console.log('Vendor price is lower than market price.');
    } else {
        console.log('Market price is equal to vendor price.');
    }
}

// Example usage
comparePrices(100, 120);
comparePrices(150, 100);
comparePrices(200, 200);
