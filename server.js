const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const { calculateOverallTotal } = require('./calculation.js');

const pricingPath = path.join(__dirname, 'optimized-pricingData.json');
const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

app.use(express.json());
app.use(express.static('public'));

app.post('/calculate', (req, res) => {
  try {
    const result = calculateOverallTotal(req.body, pricingData);
    res.json(result);
  } catch (error) {
    console.error('Error during calculation:', error);
    res.status(500).json({ error: 'Calculation error' });
  }
});

app.listen(3001, () => {
  console.log('Local dev server running at http://localhost:3001');
});
