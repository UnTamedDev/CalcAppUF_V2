// --- FILE: server.js ---

const express = require('express');
const path = require('path');
const fs = require('fs');
const { calculateOverallTotal } = require('./calculation.js'); // Import calculation logic

const app = express();
const PORT = process.env.PORT || 3001; // Use Render's port or 3001 for local dev

// --- Load Pricing Data ---
// Construct the absolute path to the pricing data file
const pricingPath = path.join(__dirname, 'data', 'pricingData.json');
let pricingData;
try {
    const rawData = fs.readFileSync(pricingPath, 'utf8');
    pricingData = JSON.parse(rawData);
    console.log("[Server] Pricing data loaded successfully.");
    // Basic validation of loaded data
    if (!pricingData || !pricingData.doorPricingGroups || !pricingData.hingeCosts || !pricingData.customPaint || !pricingData.lazySusan) {
         throw new Error("Pricing data is missing required sections (doorPricingGroups, hingeCosts, customPaint, lazySusan).");
    }
} catch (error) {
    console.error("[Server] FATAL ERROR: Could not load or parse pricing data.", error);
    // Exit if pricing data is essential and cannot be loaded
    process.exit(1);
}


// --- Middleware ---
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS, Assets) from 'public' folder

// --- API Routes ---
app.post('/api/calculate', (req, res) => {
    console.log(`[Server] Received POST request on /api/calculate`);
    try {
        // Pass the loaded pricing data to the calculation function
        const result = calculateOverallTotal(req.body, pricingData);
        console.log(`[Server] Calculation successful. Sending response.`);
        res.json(result);
    } catch (error) {
        console.error('[Server] Error during calculation:', error.message);
        // Send a more informative error response
        res.status(400).json({ error: 'Calculation error', message: error.message }); // Use 400 for bad input/calc errors
    }
});

// --- Base Route (Serve index.html) ---
// Optional: Explicitly serve index.html for the root path,
// though express.static usually handles this. Good for clarity.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Generic Error Handler (Place after all routes) ---
// Catches errors not handled in specific routes
app.use((err, req, res, next) => {
  console.error("[Server] Unhandled Error:", err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`[Server] nuDoors Estimator UF server running at http://localhost:${PORT}`);
});