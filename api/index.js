// --- FILE: api/index.js (SIMPLIFIED - Test 1) ---
console.log('[API_INIT] Starting api/index.js module load...');

const express = require('express');
const serverlessHttp = require('serverless-http');
// const path = require('path'); // Temporarily remove
// const { calculateOverallTotal } = require('../calculation.js'); // Temporarily remove
// let pricingData = require('./optimized-pricingData.json'); // Temporarily remove

console.log('[API_INIT] Express app setup starting...');
const app = express();
app.use(express.json()); // Keep JSON parsing

console.log('[API_INIT] API route setup starting...');
app.post('/api/index.js', async (req, res) => {
    const requestStartTime = Date.now();
    console.log(`  [API_HANDLER] ${requestStartTime} - Received simplified POST request.`);
    // --- REMOVED ALL LOGIC ---
    res.status(200).json({ message: "Simplified test OK", received: req.body }); // Just echo back
    console.log(`  [API_HANDLER] ${requestStartTime} - Sent simplified response.`);
});

console.log('[API_INIT] Express app setup complete.');
console.log('[API_INIT] Exporting handler...');
module.exports = serverlessHttp(app);
console.log('[API_INIT] Handler exported.');