// --- FILE: calculation.js ---

/**
 * Builds a map of door style to pricing group for quick lookup.
 * @param {Array} doorPricingGroups - Array of pricing group objects.
 * @returns {Object} - Map where keys are style names and values are price objects.
 */
function buildStylePriceMap(doorPricingGroups) {
  const styleMap = {};
  // Add input validation
  if (!Array.isArray(doorPricingGroups)) {
    console.error("[Calc] Invalid doorPricingGroups input:", doorPricingGroups);
    return styleMap; // Return empty map on invalid input
  }
  for (const group of doorPricingGroups) {
    // Add checks for group structure
    if (!group || !Array.isArray(group.styles)) continue;
    for (const style of group.styles) {
      // Ensure style is a string and prices are numbers or fallback to 0
      if (typeof style === 'string') {
        styleMap[style] = {
          Painted: Number(group.Painted) || 0,
          Primed: Number(group.Primed) || 0,
          Unfinished: Number(group.Unfinished) || 0
        };
      }
    }
  }
  return styleMap;
}

/**
 * Calculates the area in square feet.
 * @param {string|number} height - Height in inches.
 * @param {string|number} width - Width in inches.
 * @returns {number} - Area in square feet.
 */
function calculateArea(height, width) {
  // Use parseFloat for potentially decimal inputs, default to 0 if invalid
  const numHeight = parseFloat(height);
  const numWidth = parseFloat(width);
  if (isNaN(numHeight) || isNaN(numWidth) || numHeight <= 0 || numWidth <= 0) {
    return 0; // Return 0 for invalid or non-positive dimensions
  }
  return (numHeight * numWidth) / 144;
}

/**
 * Gets the price for a given style and finish from the map.
 * @param {Object} styleMap - The map generated by buildStylePriceMap.
 * @param {string} style - The door/drawer style name.
 * @param {string} finish - The finish type ('Painted', 'Primed', 'Unfinished').
 * @returns {number} - Price per square foot, or 0 if not found.
 */
function getStylePrice(styleMap, style, finish) {
  // Added fallback for missing style or finish
  return styleMap?.[style]?.[finish] ?? 0;
}

/**
 * Calculates the cost for a single section.
 * @param {Object} section - Section data (height, width, doorStyle, drawerStyle, finish).
 * @param {Object} styleMap - The style-to-price map.
 * @returns {Object} - Object containing calculated area, costs, and section details.
 */
function calculateSectionCost(section, styleMap) {
  const area = calculateArea(section.height, section.width);
  const doorPrice = getStylePrice(styleMap, section.doorStyle, section.finish);

  // Only calculate drawer cost IF the drawer style is different AND valid
  let drawerCost = 0;
  let drawerPrice = 0; // Initialize drawerPrice
  if (section.drawerStyle && section.drawerStyle !== section.doorStyle) {
      drawerPrice = getStylePrice(styleMap, section.drawerStyle, section.finish);
      drawerCost = area * drawerPrice;
      // Handle potential edge case: Drawer style exists but has 0 price for the finish
      if (drawerCost === 0 && drawerPrice === 0 && styleMap[section.drawerStyle]) {
           console.warn(`[Calc] Drawer style "${section.drawerStyle}" found, but price for finish "${section.finish}" is 0.`);
      } else if (drawerCost === 0 && !styleMap[section.drawerStyle]) {
           console.warn(`[Calc] Drawer style "${section.drawerStyle}" not found in pricing map.`);
           // Reset drawerCost just to be safe if the style doesn't exist at all
           drawerCost = 0;
      }
  }


  const doorCost = area * doorPrice;


  // Explicitly return numbers, rounded at the end
  return {
    area: Number(area.toFixed(4)),
    doorCost: Number(doorCost.toFixed(2)),
    drawerCost: Number(drawerCost.toFixed(2)),
    totalSectionCost: Number((doorCost + drawerCost).toFixed(2)),
    // Echo back input values for clarity in results
    doorStyle: section.doorStyle,
    drawerStyle: section.drawerStyle,
    finish: section.finish,
    height: section.height,
    width: section.width
  };
}

/**
 * Calculates total hinge cost based on door counts and pricing.
 * @param {Object} part2 - Object containing door counts (doors_0_36, etc.).
 * @param {Object} hingeCosts - Object with hinge prices per size range.
 * @returns {number} - Total hinge cost.
 */
function calculateHingeCost(part2, hingeCosts) {
  const d0_36 = Number(part2?.doors_0_36 || 0);
  const d36_60 = Number(part2?.doors_36_60 || 0);
  const d60_82 = Number(part2?.doors_60_82 || 0);
  // Use safe navigation and default to 0 for costs
  const c0_36 = Number(hingeCosts?.["0-36"] || 0);
  const c36_60 = Number(hingeCosts?.["36.01-60"] || 0);
  const c60_82 = Number(hingeCosts?.["60.01-82"] || 0);

  // Check if hinge costs were loaded correctly
  if (c0_36 === 0 && c36_60 === 0 && c60_82 === 0 && (d0_36 > 0 || d36_60 > 0 || d60_82 > 0)) {
       console.warn("[Calc] Hinge counts provided, but hinge costs seem to be missing or zero in pricing data.");
  }

  return (d0_36 * c0_36) + (d36_60 * c36_60) + (d60_82 * c60_82);
}

/**
 * Calculates costs for special features (currently only custom paint).
 * @param {Object} part3 - Object containing special feature quantities (customPaintQty).
 * @param {Object} customPaintPricing - Object with custom paint price info.
 * @returns {Object} - Object containing calculated costs for special features.
 */
function calculateSpecialFeaturesCost(part3, customPaintPricing) {
  const qty = Number(part3?.customPaintQty || 0);
  const price = Number(customPaintPricing?.price || 0);
  // Check if price seems valid
  if (price === 0 && qty > 0) {
       console.warn("[Calc] Custom paint quantity provided, but price is missing or zero in pricing data.");
  }
  return { customPaintCost: qty * price };
}

// Helper function to format numbers to 2 decimal places
const format = (num) => Number((Number(num) || 0).toFixed(2));

/**
 * Main function to calculate the overall total estimate.
 * @param {Object} payload - The request body containing sections, part2, part3.
 * @param {Object} pricingData - The full pricing data object.
 * @returns {Object} - Object containing the full estimate breakdown and totals.
 */
function calculateOverallTotal(payload, pricingData) {
  // Validate inputs
  if (!payload || typeof payload !== 'object') {
       throw new Error("Invalid payload provided for calculation.");
  }
  if (!pricingData || typeof pricingData !== 'object' || !pricingData.doorPricingGroups || !pricingData.hingeCosts || !pricingData.customPaint) {
       throw new Error("Invalid or incomplete pricing data provided for calculation.");
  }

  const styleMap = buildStylePriceMap(pricingData.doorPricingGroups);
  const sections = payload.sections || [];
  const part2 = payload.part2 || {};
  const part3 = payload.part3 || {};

  let totalAllSectionCost = 0;
  const sectionBreakdown = [];

  // Input validation for sections array
  if (!Array.isArray(sections)) {
      console.warn("[Calc] Payload 'sections' is not an array. Defaulting to empty.", sections);
      // Optionally throw error or just proceed with empty array based on requirements
      // throw new Error("Payload 'sections' must be an array.");
      sections = []; // Ensure it's an array
  }


  for (const section of sections) {
    // Basic validation for each section object
    if (typeof section === 'object' && section !== null) {
         const result = calculateSectionCost(section, styleMap);
         sectionBreakdown.push(result);
         totalAllSectionCost += result.totalSectionCost;
    } else {
         console.warn("[Calc] Skipping invalid section data:", section);
    }
  }

  const hingeCost = calculateHingeCost(part2, pricingData.hingeCosts);
  const specialFeatures = calculateSpecialFeaturesCost(part3, pricingData.customPaint);

  // --- Calculate Lazy Susan Cost ---
  const lazySusanPrice = Number(pricingData.lazySusan?.price || 0);
  const lazySusanQty = Number(part2.lazySusanQty || 0);
  const lazySusanTotalCost = lazySusanQty * lazySusanPrice;
  if (lazySusanPrice === 0 && lazySusanQty > 0) {
      console.warn("[Calc] Lazy Susan quantity provided, but price is missing or zero in pricing data.");
  }

  // --- Calculate Overall Total (Including Lazy Susans now) ---
  const overallTotal = totalAllSectionCost + hingeCost + specialFeatures.customPaintCost + lazySusanTotalCost;

  const hingeCount =
    (Number(part2?.doors_0_36 || 0) * 2) +
    (Number(part2?.doors_36_60 || 0) * 3) +
    (Number(part2?.doors_60_82 || 0) * 4);

  return {
    overallTotal: format(overallTotal),
    doorCostTotal: format(totalAllSectionCost), // Cost of doors/drawers from sections
    hingeCost: format(hingeCost),
    hingeCount,
    lazySusanCost: format(lazySusanTotalCost), // Add LS cost explicitly
    specialFeatures: { customPaintCost: format(specialFeatures.customPaintCost) },
    // Return breakdown
    sections: sectionBreakdown,
    // Return input parts for potential display on frontend summary
    part2: part2,
    part3: part3
  };
}

module.exports = {
  calculateOverallTotal
};