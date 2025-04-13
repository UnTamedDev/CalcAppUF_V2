// --- FILE: public/script.js (FULL VERSION - USE THIS) ---

let pricingData = null;
let styleMap = {};
let allStyles = [];
let currentStep = 1;
let sectionCounter = 0; // Keep track of added sections

// --- DOM Element References --- (Good practice to get them once)
let wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printBtn, toggleExampleBtn, exampleImageDiv, printButtonContainer, toggleDetailsBtn, internalDetailsDiv;

/** Build styleMap from pricingData.doorPricingGroups */
function buildStyleMapAndList(groups) {
    const map = {};
    const list = [];
    if (!groups || !Array.isArray(groups)) {
        console.error("[Client] Invalid doorPricingGroups data:", groups);
        return { map: {}, list: [] };
    }
    for (const group of groups) {
        if (!group.styles || !Array.isArray(group.styles)) continue; // Skip invalid groups
        for (const style of group.styles) {
            map[style] = {
                Painted: group.Painted,
                Primed: group.Primed,
                Unfinished: group.Unfinished
            };
            list.push(style);
        }
    }
    return { map, list: list.sort() };
}

/** Populate dropdowns once pricing data is loaded */
function populateStyleDropdowns(container) {
    const doorSelect = container.querySelector('select[name="sectionDoorStyle"]');
    const drawerSelect = container.querySelector('select[name="sectionDrawerStyle"]');
    if (!doorSelect || !drawerSelect) return;

    // Preserve selected value if already set (useful for re-renders if needed)
    const currentDoorVal = doorSelect.value;
    const currentDrawerVal = drawerSelect.value;

    const optionsHtml = allStyles.map(style => `<option value="${style}">${style}</option>`).join('');
    doorSelect.innerHTML = optionsHtml;
    drawerSelect.innerHTML = optionsHtml;

    // Restore selection
    if (currentDoorVal && allStyles.includes(currentDoorVal)) {
        doorSelect.value = currentDoorVal;
    }
    if (currentDrawerVal && allStyles.includes(currentDrawerVal)) {
        drawerSelect.value = currentDrawerVal;
    }
     // Set a default if nothing was selected or available
     if (!doorSelect.value && allStyles.length > 0) doorSelect.value = allStyles[0];
     if (!drawerSelect.value && allStyles.length > 0) drawerSelect.value = allStyles[0];
}

/** Fetch pricing data */
async function initPricingData() {
    try {
        console.log('[Client] Fetching pricing data...');
        // Ensure the path matches where the file is served (root if in public/)
        const res = await fetch('/optimized-pricingData.json');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        pricingData = await res.json();

        if (!pricingData || !pricingData.doorPricingGroups) {
             throw new Error('Fetched pricing data is invalid or missing doorPricingGroups.');
        }

        const { map, list } = buildStyleMapAndList(pricingData.doorPricingGroups);
        styleMap = map;
        allStyles = list;
        console.log('[Client] Pricing data loaded and processed. Styles:', allStyles);

        initializeSections(); // Initialize the first section now that styles are ready
        initializeWizard(); // Setup navigation etc. AFTER data load

    } catch (e) {
        console.error('[Client] Failed to load or process pricing data:', e);
        // Display error to user?
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong> Could not load essential pricing data. Please try refreshing the page. If the problem persists, contact support.</p><p><small>${e.message}</small></p></div>`;
        // Disable calculation button?
        if(calculateBtn) calculateBtn.disabled = true;
    }
}

/** Create HTML for a single section */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index; // Use index for data tracking
    sectionDiv.innerHTML = `
      <div class="section-header">
        <span class="section-id">Section ${index + 1}</span>
        <button type="button" class="remove-button" data-remove-index="${index}" title="Remove Section ${index + 1}">×</button>
      </div>
      <label>Door Style:</label><select name="sectionDoorStyle" required></select>
      <label>Drawer Style:</label><select name="sectionDrawerStyle" required></select>
      <label>Finish:</label>
      <select name="sectionFinish" required>
        <option value="Painted">Painted</option>
        <option value="Primed">Primed</option>
        <option value="Unfinished">Unfinished</option>
      </select>
      <div class="dimension-inputs">
        <label>Height (in):</label><input type="number" name="sectionHeight" value="12" min="1" step="0.01" required />
        <label>Width (in):</label><input type="number" name="sectionWidth" value="12" min="1" step="0.01" required />
      </div>
    `;
    populateStyleDropdowns(sectionDiv); // Populate styles for this new section
    return sectionDiv;
}

/** Add a new section */
function handleAddSection() {
    console.log('[Client] Adding section');
    const newSection = createRoughEstimateSection(sectionCounter);
    sectionsContainer.appendChild(newSection);
    sectionCounter++;
    updateSectionNumbers(); // Renumber sections visually
}

/** Remove a section */
function handleRemoveSection(event) {
    if (event.target.classList.contains('remove-button')) {
        const indexToRemove = event.target.dataset.removeIndex;
        const sectionToRemove = sectionsContainer.querySelector(`.section[data-index="${indexToRemove}"]`);
        if (sectionToRemove) {
            console.log(`[Client] Removing section with index ${indexToRemove}`);
            sectionToRemove.remove();
            updateSectionNumbers(); // Renumber remaining sections
        }
    }
}

/** Update the visual numbering of sections after add/remove */
function updateSectionNumbers() {
     const remainingSections = sectionsContainer.querySelectorAll('.section');
     remainingSections.forEach((section, i) => {
         const idSpan = section.querySelector('.section-id');
         const removeBtn = section.querySelector('.remove-button');
         if (idSpan) idSpan.textContent = `Section ${i + 1}`;
         section.dataset.index = i; // Update data index
         if (removeBtn) {
             removeBtn.dataset.removeIndex = i; // Update button data index
             removeBtn.title = `Remove Section ${i + 1}`;
         }
     });
     // Update the main counter to reflect the current number of sections
     sectionCounter = remainingSections.length;
     console.log('[Client] Section count updated to:', sectionCounter);
}


/** Navigate Wizard */
function navigateWizard(direction) {
    const currentStepElement = wizard.querySelector(`.wizard-step.active`);
    const nextStep = direction === 'next' ? currentStep + 1 : currentStep - 1;

    if (nextStep < 1 || nextStep > steps.length) {
        console.warn('[Client] Navigation attempt out of bounds.');
        return; // Boundary check
    }

    const nextStepElement = wizard.querySelector(`#step-${nextStep}`);

    if (currentStepElement && nextStepElement) {
        // Add hiding class for transition out
        currentStepElement.classList.add('hiding');
        currentStepElement.classList.remove('active');

        // After the transition duration, remove hiding and set inactive
        setTimeout(() => {
            currentStepElement.classList.remove('hiding');
        }, 400); // Match transition duration in CSS

        // Activate the next step
        nextStepElement.classList.add('active');
        currentStep = nextStep;
        console.log(`[Client] Navigated to step ${currentStep}`);
    } else {
         console.error(`[Client] Wizard step element not found for current (${currentStep}) or next (${nextStep})`);
    }
}

/** Gather data from all form parts */
function gatherFormData() {
    const formData = {
        sections: [],
        part2: {},
        part3: {}
    };

    // Step 1: Sections
    const sectionElements = sectionsContainer.querySelectorAll('.section');
    sectionElements.forEach((sectionEl, index) => {
        const sectionData = {
            id: index + 1, // Add an ID for easier reference
            doorStyle: sectionEl.querySelector('[name="sectionDoorStyle"]').value,
            drawerStyle: sectionEl.querySelector('[name="sectionDrawerStyle"]').value,
            finish: sectionEl.querySelector('[name="sectionFinish"]').value,
            height: sectionEl.querySelector('[name="sectionHeight"]').value,
            width: sectionEl.querySelector('[name="sectionWidth"]').value
        };
        formData.sections.push(sectionData);
    });

    // Step 2: Piece Count
    const step2Form = document.getElementById('calcFormStep2');
    if (step2Form) {
         formData.part2.numDrawers = step2Form.querySelector('[name="numDrawers"]').value;
         formData.part2.doors_0_36 = step2Form.querySelector('[name="doors_0_36"]').value;
         formData.part2.doors_36_60 = step2Form.querySelector('[name="doors_36_60"]').value;
         formData.part2.doors_60_82 = step2Form.querySelector('[name="doors_60_82"]').value;
         formData.part2.lazySusanQty = step2Form.querySelector('[name="lazySusanQty"]').value;
    }


    // Step 3: Special Features
     const step3Form = document.getElementById('calcFormStep3');
    if (step3Form) {
         formData.part3.customPaintQty = step3Form.querySelector('[name="customPaintQty"]').value;
    }


    return formData;
}

/** Handle calculation submission */
async function handleCalculate() {
    console.log('[Client] Calculate button clicked.');
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
    resultsDiv.innerHTML = '<p style="text-align:center; padding: 2em;">Generating estimate...</p>'; // Loading indicator

    const payload = gatherFormData();
    console.log('[Client] Sending payload:', JSON.stringify(payload));

    try {
        // *** ENSURE THIS IS POINTING TO THE VERCEL API ENDPOINT ***
        const response = await fetch('/api/index.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
            throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        }

        const resultsData = await response.json();
        console.log('[Client] Received calculation results:', resultsData);
        displayResults(resultsData);
        navigateWizard('next'); // Move to results step (Step 4)

    } catch (error) {
        console.error('[Client] Error during calculation request:', error);
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Calculation Error:</strong> ${error.message}</p><p>Please check your inputs or try again later.</p></div>`;
        // Optionally navigate back or stay on the current step
        // navigateWizard('prev'); // Example: Go back if calc fails
    } finally {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate Estimate';
    }
}

/** Format currency */
const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};


/** Display results in the results div */
function displayResults(data) {
    if (!data || typeof data !== 'object') {
        resultsDiv.innerHTML = '<div class="invoice-error"><p>Received invalid results data.</p></div>';
        return;
    }

    const {
        overallTotal = 0,
        doorCostTotal = 0,
        hingeCost = 0,
        hingeCount = 0,
        specialFeatures = {},
        sections = [],
        part2 = {}, // Include part2 and part3 if you want to display inputs
        part3 = {}
    } = data;

    // --- Summary Table ---
    let summaryHtml = `
        <table class="summary-table">
            <tbody>
                <tr><td class="table-label">Total Section Cost (Doors/Drawers)</td><td class="table-value">${formatCurrency(doorCostTotal)}</td></tr>
                <tr><td class="table-label">Hinge Boring Cost (${hingeCount} hinges)</td><td class="table-value">${formatCurrency(hingeCost)}</td></tr>
    `;
    if (specialFeatures.customPaintCost > 0) {
        summaryHtml += `<tr><td class="table-label">Custom Paint Fee</td><td class="table-value">${formatCurrency(specialFeatures.customPaintCost)}</td></tr>`;
    }
    // Add Lazy Susan cost if applicable (assuming it's bundled elsewhere or needs adding here)
     const lazySusanPrice = pricingData?.lazySusan?.price || 0; // Get price from loaded data
     const lazySusanTotal = (Number(part2.lazySusanQty) || 0) * lazySusanPrice;
     if (lazySusanTotal > 0) {
         summaryHtml += `<tr><td class="table-label">Lazy Susans (${part2.lazySusanQty || 0})</td><td class="table-value">${formatCurrency(lazySusanTotal)}</td></tr>`;
         // !!! IMPORTANT: The overallTotal from the backend currently DOES NOT include Lazy Susan cost
         // You might need to adjust the backend calculation OR add it here on the frontend for display
         // overallTotal += lazySusanTotal; // Example if adding on frontend
     }


    summaryHtml += `
            </tbody>
            <tfoot>
                <tr class="total-row"><td class="table-label">Estimated Total</td><td class="table-value">${formatCurrency(overallTotal)}</td></tr>
            </tfoot>
        </table>
    `;

    // --- Detailed Breakdown (Initially Hidden) ---
    let detailsHtml = '<div id="internalDetails" style="display: none;" class="details-section">';
    detailsHtml += `<h3>Detailed Section Breakdown</h3>`;
    detailsHtml += `<table class="details-table">
        <thead><tr><th>Section</th><th>Door</th><th>Drawer</th><th>Finish</th><th>HxW (in)</th><th>Area (sqft)</th><th>Cost</th></tr></thead>
        <tbody>`;
    sections.forEach((s, i) => {
        detailsHtml += `
            <tr>
                <td>${i + 1}</td>
                <td>${s.doorStyle || 'N/A'}</td>
                <td>${s.drawerStyle || 'N/A'}</td>
                <td>${s.finish || 'N/A'}</td>
                <td>${s.height || 0}" x ${s.width || 0}"</td>
                <td>${s.area?.toFixed(2) || 'N/A'}</td>
                <td>${formatCurrency(s.totalSectionCost)}</td>
            </tr>
        `;
    });
    detailsHtml += `</tbody></table>`;

    // Add hinge details if needed
    detailsHtml += `<h3>Hinge & Other Counts</h3>`;
    detailsHtml += `<table class="details-table"><tbody>
        <tr><td>Doors 0-36" Qty</td><td>${part2.doors_0_36 || 0}</td></tr>
        <tr><td>Doors 36-60" Qty</td><td>${part2.doors_36_60 || 0}</td></tr>
        <tr><td>Doors 60-82" Qty</td><td>${part2.doors_60_82 || 0}</td></tr>
        <tr><td>Total Drawers</td><td>${part2.numDrawers || 0}</td></tr>
        <tr><td>Lazy Susans</td><td>${part2.lazySusanQty || 0}</td></tr>
        <tr><td>Custom Paint Colors</td><td>${part3.customPaintQty || 0}</td></tr>
    </tbody></table>`;

    detailsHtml += '</div>'; // End #internalDetails

    // --- Invoice Structure ---
    resultsDiv.innerHTML = `
      <div class="invoice">
          <div class="invoice-header">
              <!-- You might want to add the logo here too -->
              <h1>Estimate Summary</h1>
              <p>Thank you for using the nuDoors Estimator!</p>
          </div>
          <h2>Summary</h2>
          ${summaryHtml}

          <div style="text-align: center; margin-bottom: 1.5em;">
             <button type="button" id="toggleDetailsBtn">Show Details</button>
          </div>

          ${detailsHtml}

          <div class="estimate-footer">
              <p>This is an estimate only. Final price may vary based on final measurements and selections. Tax not included.</p>
          </div>
      </div>
    `;

    // Add event listener for the new details button
    toggleDetailsBtn = document.getElementById('toggleDetailsBtn');
    internalDetailsDiv = document.getElementById('internalDetails');
    if (toggleDetailsBtn && internalDetailsDiv) {
         toggleDetailsBtn.addEventListener('click', handleToggleDetails);
         toggleDetailsBtn.style.display = 'inline-block'; // Make sure it's visible
    } else {
         console.warn('[Client] Could not find toggle details button or details div after rendering results.');
    }


    // Show Print and Start Over buttons
    if(printButtonContainer) printButtonContainer.style.display = 'block';
    if(startOverBtn) startOverBtn.style.display = 'inline-block'; // Ensure start over is visible on results page
}

/** Toggle visibility of the detailed breakdown */
function handleToggleDetails() {
    if (!internalDetailsDiv || !toggleDetailsBtn) return;

    const isHidden = internalDetailsDiv.style.display === 'none';
    internalDetailsDiv.style.display = isHidden ? 'block' : 'none';
    toggleDetailsBtn.textContent = isHidden ? 'Hide Details' : 'Show Details';
    // Add class for printing if shown
    internalDetailsDiv.classList.toggle('print-section', isHidden);
}


/** Toggle example image */
function handleToggleExample() {
    if (!exampleImageDiv || !toggleExampleBtn) return;
    const isHidden = exampleImageDiv.style.display === 'none';
    exampleImageDiv.style.display = isHidden ? 'block' : 'none';
    toggleExampleBtn.textContent = isHidden ? 'Hide Example Image' : 'Show Example Image';
}

/** Reset the form and go back to step 1 */
function handleStartOver() {
    console.log('[Client] Starting over.');
    // Reset forms (can be more specific if needed)
    document.getElementById('calcFormStep1').reset();
    document.getElementById('calcFormStep2').reset();
    document.getElementById('calcFormStep3').reset();

    // Clear dynamic sections
    sectionsContainer.innerHTML = '';
    sectionCounter = 0;
    initializeSections(); // Add back the first section

    // Clear results
    resultsDiv.innerHTML = '';
    if(printButtonContainer) printButtonContainer.style.display = 'none';
     if(toggleDetailsBtn) toggleDetailsBtn.style.display = 'none'; // Hide toggle button

    // Reset to step 1
    const currentActive = wizard.querySelector('.wizard-step.active');
    const firstStep = wizard.querySelector('#step-1');
    if (currentActive && firstStep && currentActive !== firstStep) {
        currentActive.classList.remove('active');
        firstStep.classList.add('active');
    }
    currentStep = 1;
}

/** Add the first section */
function initializeSections() {
     // Clear any existing sections first (important for start over)
     sectionsContainer.innerHTML = '';
     sectionCounter = 0;
     // Add the initial section only if styles are loaded
     if (allStyles.length > 0) {
         handleAddSection(); // Add the first section
     } else {
         console.warn('[Client] Cannot initialize sections, styles not loaded yet.');
         // Maybe display a message in the sections container?
         sectionsContainer.innerHTML = '<p style="text-align: center; color: #888;">Loading styles...</p>';
     }
}

/** Set up wizard navigation and button listeners */
function initializeWizard() {
    console.log('[Client] Initializing wizard UI...');
    // Navigation Buttons
    wizard.querySelectorAll('.wizard-nav-btn.next').forEach(btn => {
        btn.addEventListener('click', () => navigateWizard('next'));
    });
    wizard.querySelectorAll('.wizard-nav-btn.prev').forEach(btn => {
        btn.addEventListener('click', () => navigateWizard('prev'));
    });

    // Specific Action Buttons
    if(addSectionBtn) addSectionBtn.addEventListener('click', handleAddSection);
    if(calculateBtn) calculateBtn.addEventListener('click', handleCalculate);
    if(startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
    if(printBtn) printBtn.addEventListener('click', () => window.print());
    if(toggleExampleBtn) toggleExampleBtn.addEventListener('click', handleToggleExample);

    // Listener for removing sections (using event delegation on the container)
    if(sectionsContainer) sectionsContainer.addEventListener('click', handleRemoveSection);

    // Set initial state
    steps.forEach((step, index) => {
        step.classList.remove('active', 'hiding');
        if (index === 0) {
            step.classList.add('active');
        }
    });
    currentStep = 1;
    if(printButtonContainer) printButtonContainer.style.display = 'none'; // Hide print initially
    if(startOverBtn) startOverBtn.style.display = 'inline-block'; // Ensure start over is visible but perhaps move logic elsewhere if needed on first step

     console.log('[Client] Wizard UI Initialized.');
}


/** Start app */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Client] DOM Loaded. App initializing...');

    // Get references to major elements
    wizard = document.getElementById('wizard');
    steps = wizard.querySelectorAll('.wizard-step');
    sectionsContainer = document.getElementById('sectionsContainer');
    addSectionBtn = document.getElementById('addSectionBtn');
    calculateBtn = document.getElementById('calculateBtn');
    resultsDiv = document.getElementById('results');
    startOverBtn = document.getElementById('startOverBtn');
    printBtn = document.getElementById('printEstimate');
    printButtonContainer = document.getElementById('printButtonContainer');
    toggleExampleBtn = document.getElementById('toggleExampleBtn');
    exampleImageDiv = document.getElementById('exampleImage');
    // toggleDetailsBtn and internalDetailsDiv are assigned dynamically after results are rendered

    // Check if essential elements exist
    if (!wizard || !steps.length || !sectionsContainer || !addSectionBtn || !calculateBtn || !resultsDiv || !startOverBtn || !printBtn || !toggleExampleBtn || !exampleImageDiv) {
         console.error("[Client] Critical UI elements missing from the DOM. Aborting initialization.");
         document.body.innerHTML = '<p style="color: red; font-weight: bold; padding: 2em;">Error: UI is incomplete. Cannot start the estimator.</p>';
         return;
    }


    initPricingData(); // Load data first, which then calls initializeSections and initializeWizard
});