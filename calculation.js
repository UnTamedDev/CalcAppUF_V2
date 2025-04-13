// --- FILE: optimized-calculation.js ---

/**
 * Builds a map of door style to pricing group for quick lookup.
 */
function buildStylePriceMap(doorPricingGroups) {
  const styleMap = {};
  for (const group of doorPricingGroups) {
    for (const style of group.styles) {
      styleMap[style] = {
        Painted: group.Painted,
        Primed: group.Primed,
        Unfinished: group.Unfinished
      };
    }
  }
  return styleMap;
}

function calculateArea(height, width) {
  return (Number(height || 0) * Number(width || 0)) / 144;
}

function getStylePrice(styleMap, style, finish) {
  return styleMap?.[style]?.[finish] ?? 0;
}

function calculateSectionCost(section, styleMap) {
  const area = calculateArea(section.height, section.width);
  const doorPrice = getStylePrice(styleMap, section.doorStyle, section.finish);
  const drawerPrice = getStylePrice(styleMap, section.drawerStyle, section.finish);

  const doorCost = area * doorPrice;
  const drawerCost = section.drawerStyle !== section.doorStyle ? area * drawerPrice : 0;

  return {
    area: Number(area.toFixed(4)),
    doorCost: Number(doorCost.toFixed(2)),
    drawerCost: Number(drawerCost.toFixed(2)),
    totalSectionCost: Number((doorCost + drawerCost).toFixed(2)),
    doorStyle: section.doorStyle,
    drawerStyle: section.drawerStyle,
    finish: section.finish,
    height: section.height,
    width: section.width
  };
}

function calculateHingeCost(part2, hingeCosts) {
  const d0_36 = Number(part2.doors_0_36 || 0);
  const d36_60 = Number(part2.doors_36_60 || 0);
  const d60_82 = Number(part2.doors_60_82 || 0);
  const c0_36 = Number(hingeCosts["0-36"] || 0);
  const c36_60 = Number(hingeCosts["36.01-60"] || 0);
  const c60_82 = Number(hingeCosts["60.01-82"] || 0);
  return (d0_36 * c0_36) + (d36_60 * c36_60) + (d60_82 * c60_82);
}

function calculateSpecialFeaturesCost(part3, customPaint) {
  const qty = Number(part3.customPaintQty || 0);
  const price = Number(customPaint.price || 0);
  return { customPaintCost: qty * price };
}

function calculateOverallTotal(payload, pricingData) {
  const styleMap = buildStylePriceMap(pricingData.doorPricingGroups);
  const sections = payload.sections || [];
  const part2 = payload.part2 || {};
  const part3 = payload.part3 || {};

  let totalAllSectionCost = 0;
  const sectionBreakdown = [];

  for (const section of sections) {
    const result = calculateSectionCost(section, styleMap);
    sectionBreakdown.push(result);
    totalAllSectionCost += result.totalSectionCost;
  }

  const hingeCost = calculateHingeCost(part2, pricingData.hingeCosts);
  const specialFeatures = calculateSpecialFeaturesCost(part3, pricingData.customPaint);

  const overallTotal = totalAllSectionCost + hingeCost + specialFeatures.customPaintCost;
  const hingeCount =
    (Number(part2.doors_0_36 || 0) * 2) +
    (Number(part2.doors_36_60 || 0) * 3) +
    (Number(part2.doors_60_82 || 0) * 4);

  const format = (num) => Number((Number(num) || 0).toFixed(2));

  return {
    overallTotal: format(overallTotal),
    doorCostTotal: format(totalAllSectionCost),
    hingeCost: format(hingeCost),
    hingeCount,
    specialFeatures: { customPaintCost: format(specialFeatures.customPaintCost) },
    sections: sectionBreakdown,
    part2,
    part3
  };
}

module.exports = {
  calculateOverallTotal
};