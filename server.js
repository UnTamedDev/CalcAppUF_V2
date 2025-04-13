// --- FILE: server.js (Updated Path) ---

const express = require('express');
const path = require('path');
const fs = require('fs');
const { calculateOverallTotal } = require('./calculation.js'); // Import calculation logic

const app = express();
const PORT = process.env.PORT || 3001; // Use Render's port or 3001 for local dev

// --- Load Pricing Data ---
// *** Construct the CORRECTED absolute path to the pricing data file ***
const pricingPath = path.join(__dirname, 'public', 'data', 'pricingData.json'); // Changed path here!
let pricingData;
try {
    const rawData = fs.readFileSync(pricingPath, 'utf8');
    pricingData = JSON.parse(rawData);
    console.log("[Server] Pricing data loaded successfully from public/data."); // Updated log
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
// Serve static files (HTML, CSS, JS, Assets, AND NOW DATA) from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

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
// This is technically handled by express.static, but can leave it for clarity
// or remove if you prefer less code.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Generic Error Handler (Place after all routes) ---
app.use((err, req, res, next) => {
  console.error("[Server] Unhandled Error:", err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`[Server] nuDoors Estimator UF server running at http://localhost:${PORT}`);
});