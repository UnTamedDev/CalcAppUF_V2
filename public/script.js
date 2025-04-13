// --- FILE: public/script.js ---

// Global variables
let pricingData = null; // Will store fetched pricing data (primarily for styles/defaults now)
let styleMap = {};      // Map for client-side price lookup if needed (less critical now)
let allStyles = [];     // List of available style names
let currentStep = 1;
let sectionCounter = 0; // Keep track of added sections

// --- DOM Element References ---
let wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printBtn, toggleExampleBtn, exampleImageDiv, printButtonContainer, themeToggleBtn; // Removed toggleDetailsBtn, internalDetailsDiv

// --- Theme Handling ---
const K_THEME = 'nuDoorsEstimatorTheme'; // Key for localStorage

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.dataset.theme = 'dark';
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; // Moon icon
        localStorage.setItem(K_THEME, 'dark');
    } else {
        // Default to light
        document.body.removeAttribute('data-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; // Sun icon
        localStorage.setItem(K_THEME, 'light');
    }
    console.log(`[Client] Theme applied: ${theme}`);
}

function handleThemeToggle() {
    const currentTheme = document.body.dataset.theme;
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(K_THEME) || 'light'; // Default to light
    // Ensure themeToggleBtn exists before trying to set its textContent
    themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn');
    applyTheme(savedTheme);
}
// --- End Theme Handling ---


/** Build style list and optionally a map from pricingData.doorPricingGroups */
function processPricingData(data) {
    const list = [];
    const map = {}; // Keep map for potential future client-side checks if needed
    if (!data || !Array.isArray(data.doorPricingGroups)) {
        console.error("[Client] Invalid pricing data received:", data);
        return { map: {}, list: [] };
    }
    for (const group of data.doorPricingGroups) {
        if (!group || !Array.isArray(group.styles)) continue;
        for (const style of group.styles) {
             if (typeof style === 'string' && !list.includes(style)) { // Avoid duplicates
                list.push(style);
                // Populate map as well (though server does primary calc)
                map[style] = {
                    Painted: group.Painted,
                    Primed: group.Primed,
                    Unfinished: group.Unfinished
                };
            }
        }
    }
    return { map, list: list.sort() }; // Sort styles alphabetically
}

/** Populate style dropdowns in a given section container */
function populateStyleDropdowns(container) {
    const doorSelect = container.querySelector('select[name="sectionDoorStyle"]');
    const drawerSelect = container.querySelector('select[name="sectionDrawerStyle"]');
    if (!doorSelect || !drawerSelect) {
        console.warn("[Client] Could not find style select elements in container:", container);
        return;
    }

    if (allStyles.length === 0) {
         console.warn("[Client] Cannot populate dropdowns, no styles available.");
         // Optionally disable the selects or show a message
         doorSelect.innerHTML = '<option value="">Error loading styles</option>';
         drawerSelect.innerHTML = '<option value="">Error loading styles</option>';
         return;
    }

    const optionsHtml = allStyles.map(style => `<option value="${style}">${style}</option>`).join('');
    doorSelect.innerHTML = optionsHtml;
    drawerSelect.innerHTML = optionsHtml;

     // Set a default selection (e.g., the first style)
     if (allStyles.length > 0) {
        doorSelect.value = allStyles[0];
        drawerSelect.value = allStyles[0];
     }
}

/** Fetch pricing data (primarily for style list) */
async function initPricingData() {
    try {
        console.log('[Client] Fetching pricing data for styles...');
        // Fetch from the correct path where server.js might expose it, or directly if static
        // Serving it directly from /data/ is simpler if it's not sensitive
        const res = await fetch('/data/pricingData.json'); // Path relative to public root
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} while fetching pricing data.`);
        }
        pricingData = await res.json();

        if (!pricingData || !pricingData.doorPricingGroups) {
             throw new Error('Fetched pricing data is invalid or missing doorPricingGroups.');
        }

        const { map, list } = processPricingData(pricingData);
        styleMap = map; // Store map just in case
        allStyles = list;
        console.log('[Client] Pricing data loaded and processed. Styles available:', allStyles.length);

        // Now that styles are loaded, initialize the first section
        initializeSections();
        // Initialize wizard functionality (nav buttons etc.)
        initializeWizard();

    } catch (e) {
        console.error('[Client] Failed to load or process pricing data:', e);
        displayError("Could not load essential configuration data. Please try refreshing the page.");
        // Disable calculation button as a safety measure
        if (calculateBtn) calculateBtn.disabled = true;
    }
}

/** Create HTML structure for a single section */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index; // Use index for data tracking
    // Use unique IDs for labels/inputs within the section
    const sectionIdPrefix = `section-${index}-`;
    sectionDiv.innerHTML = `
      <div class="section-header">
        <span class="section-id">Section ${index + 1}</span>
        <button type="button" class="remove-button" data-remove-index="${index}" title="Remove Section ${index + 1}">×</button>
      </div>
      <label for="${sectionIdPrefix}doorStyle">Door Style:</label>
      <select name="sectionDoorStyle" id="${sectionIdPrefix}doorStyle" required></select>

      <label for="${sectionIdPrefix}drawerStyle">Drawer Style:</label>
      <select name="sectionDrawerStyle" id="${sectionIdPrefix}drawerStyle" required></select>

      <label for="${sectionIdPrefix}finish">Finish:</label>
      <select name="sectionFinish" id="${sectionIdPrefix}finish" required>
        <option value="Painted" selected>Painted</option> <!-- Default selection -->
        <option value="Primed">Primed</option>
        <option value="Unfinished">Unfinished</option>
      </select>

      <div class="dimension-inputs">
        <label for="${sectionIdPrefix}height">Height (in):</label>
        <input type="number" name="sectionHeight" id="${sectionIdPrefix}height" value="12" min="1" step="0.01" required inputmode="decimal" />

        <label for="${sectionIdPrefix}width">Width (in):</label>
        <input type="number" name="sectionWidth" id="${sectionIdPrefix}width" value="12" min="1" step="0.01" required inputmode="decimal" />
      </div>
    `;
    // Populate the dropdowns for this newly created section
    populateStyleDropdowns(sectionDiv);
    return sectionDiv;
}

/** Add a new section to the container */
function handleAddSection() {
    console.log(`[Client] Adding section ${sectionCounter + 1}`);
    const newSection = createRoughEstimateSection(sectionCounter);
    sectionsContainer.appendChild(newSection);
    sectionCounter++;
    updateSectionNumbers(); // Renumber sections visually if needed (e.g., after removal)
}

/** Remove a section based on button click */
function handleRemoveSection(event) {
    // Use closest to find the button and section, handles clicks inside the button
    const removeButton = event.target.closest('.remove-button');
    if (removeButton) {
        const sectionToRemove = removeButton.closest('.section');
        if (sectionToRemove) {
            const indexToRemove = sectionToRemove.dataset.index;
            console.log(`[Client] Removing section with index ${indexToRemove}`);
            sectionToRemove.remove();
            updateSectionNumbers(); // Renumber remaining sections
        }
    }
}

/** Update the visual numbering and data attributes of sections */
function updateSectionNumbers() {
     const remainingSections = sectionsContainer.querySelectorAll('.section');
     remainingSections.forEach((section, i) => {
         const idSpan = section.querySelector('.section-id');
         const removeBtn = section.querySelector('.remove-button');
         const index = i; // Current index in the live NodeList

         if (idSpan) idSpan.textContent = `Section ${index + 1}`;
         section.dataset.index = index; // Update data index

         // Update IDs and fors within the section to maintain uniqueness
         section.querySelectorAll('[id^="section-"]').forEach(el => {
             const oldId = el.id;
             // Find the base name part (e.g., 'doorStyle', 'height')
             const namePart = oldId.substring(oldId.lastIndexOf('-') + 1);
             const newId = `section-${index}-${namePart}`;
             el.id = newId;
             // Update corresponding label 'for' attribute
             const label = section.querySelector(`label[for="${oldId}"]`);
             if(label) label.setAttribute('for', newId);
         });


         if (removeBtn) {
             removeBtn.dataset.removeIndex = index; // Update button data index
             removeBtn.title = `Remove Section ${index + 1}`;
         }
     });
     // Update the main counter AFTER re-indexing
     sectionCounter = remainingSections.length;
     console.log('[Client] Section count updated to:', sectionCounter);
     // Disable remove button if only one section left? (Optional)
     const removeButtons = sectionsContainer.querySelectorAll('.remove-button');
     removeButtons.forEach(btn => btn.disabled = (remainingSections.length <= 1));

}


/** Wizard Navigation Logic */
function navigateWizard(direction) {
    const currentStepElement = wizard.querySelector(`.wizard-step.active`);
    if (!currentStepElement) {
        console.error('[Client] Cannot navigate, active step not found.');
        return;
    }

    const targetStepNum = direction === 'next' ? currentStep + 1 : currentStep - 1;

    // --- Validation before moving NEXT from Step 1 ---
    if (direction === 'next' && currentStep === 1) {
        if (!validateStep1()) {
            // alert("Please ensure all sections have valid dimensions (Height and Width > 0).");
            // Instead of alert, highlight invalid fields
            return; // Stop navigation
        }
    }
     // --- Validation before moving NEXT from Step 2 ---
     if (direction === 'next' && currentStep === 2) {
         if (!validateStep2()) {
             // alert("Please ensure all piece counts are zero or positive numbers.");
             return; // Stop navigation
         }
     }
     // --- Validation before moving NEXT from Step 3 (Trigger Calculate) ---
     // Note: Step 3's "next" button is disabled, Calculate is used instead.
     // If enabling Step 3 Next button, add validation here.


    if (targetStepNum < 1 || targetStepNum > steps.length) {
        console.warn('[Client] Navigation attempt out of bounds.');
        return; // Boundary check
    }

    const targetStepElement = wizard.querySelector(`#step-${targetStepNum}`);

    if (targetStepElement) {
        // Transition out current step
        currentStepElement.classList.add('hiding');
        currentStepElement.classList.remove('active');

        // Set timeout to remove 'hiding' after transition (match CSS duration)
        // This is mainly visual cleanup, doesn't affect functionality
        setTimeout(() => {
            currentStepElement.classList.remove('hiding');
        }, 400); // Should match --transition-duration in CSS

        // Transition in target step
        targetStepElement.classList.add('active');
        currentStep = targetStepNum;
        console.log(`[Client] Navigated to step ${currentStep}`);

        // Scroll to top of wizard if needed
         wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } else {
         console.error(`[Client] Wizard step element not found for target step ${targetStepNum}`);
    }
}

// --- Input Validation Functions ---
function validateStep1() {
    let isValid = true;
    const sectionElements = sectionsContainer.querySelectorAll('.section');
    if (sectionElements.length === 0) {
        alert("Please add at least one section."); // Or better UI feedback
        isValid = false;
        return isValid; // Early exit if no sections
    }
    sectionElements.forEach((sectionEl) => {
        const heightInput = sectionEl.querySelector('[name="sectionHeight"]');
        const widthInput = sectionEl.querySelector('[name="sectionWidth"]');
        const height = parseFloat(heightInput.value);
        const width = parseFloat(widthInput.value);

        // Reset styles first
        heightInput.style.border = '';
        widthInput.style.border = '';

        if (isNaN(height) || height <= 0) {
            heightInput.style.border = '2px solid red';
            isValid = false;
        }
        if (isNaN(width) || width <= 0) {
            widthInput.style.border = '2px solid red';
            isValid = false;
        }
    });
    if (!isValid) {
        alert("Please ensure all section dimensions (Height and Width) are numbers greater than 0.");
    }
    return isValid;
}

function validateStep2() {
     let isValid = true;
     const step2Inputs = document.querySelectorAll('#step-2 input[type="number"]');
     step2Inputs.forEach(input => {
         const value = parseInt(input.value, 10); // Use parseInt for whole numbers
         input.style.border = ''; // Reset border
         if (isNaN(value) || value < 0) {
             input.style.border = '2px solid red';
             isValid = false;
         }
     });
     if (!isValid) {
         alert("Please ensure all piece counts are whole numbers (0 or greater).");
     }
     return isValid;
}

function validateStep3() {
     let isValid = true;
     const customPaintInput = document.querySelector('#step-3 input[name="customPaintQty"]');
     const value = parseInt(customPaintInput.value, 10);
     customPaintInput.style.border = ''; // Reset border
     if (isNaN(value) || value < 0) {
          customPaintInput.style.border = '2px solid red';
          isValid = false;
          alert("Please ensure Custom Paint Quantity is a whole number (0 or greater).");
     }
     return isValid;
}
// --- End Validation ---


/** Gather data from all relevant input fields */
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
            // id: index + 1, // ID can be inferred from array index, less critical now
            doorStyle: sectionEl.querySelector('[name="sectionDoorStyle"]').value,
            drawerStyle: sectionEl.querySelector('[name="sectionDrawerStyle"]').value,
            finish: sectionEl.querySelector('[name="sectionFinish"]').value,
            height: sectionEl.querySelector('[name="sectionHeight"]').value,
            width: sectionEl.querySelector('[name="sectionWidth"]').value
        };
        formData.sections.push(sectionData);
    });

    // Step 2: Piece Count (Use IDs set in HTML)
    const step2Container = document.getElementById('step-2');
    if (step2Container) {
         formData.part2.numDrawers = step2Container.querySelector('#numDrawers')?.value ?? '0';
         formData.part2.doors_0_36 = step2Container.querySelector('#doors_0_36')?.value ?? '0';
         formData.part2.doors_36_60 = step2Container.querySelector('#doors_36_60')?.value ?? '0';
         formData.part2.doors_60_82 = step2Container.querySelector('#doors_60_82')?.value ?? '0';
         formData.part2.lazySusanQty = step2Container.querySelector('#lazySusanQty')?.value ?? '0';
    } else {
        console.warn("[Client] Step 2 container not found during form data gathering.");
    }

    // Step 3: Special Features
     const step3Container = document.getElementById('step-3');
    if (step3Container) {
         formData.part3.customPaintQty = step3Container.querySelector('#customPaintQty')?.value ?? '0';
    } else {
         console.warn("[Client] Step 3 container not found during form data gathering.");
    }

    return formData;
}

/** Handle the calculation request */
async function handleCalculate() {
    console.log('[Client] Calculate button clicked.');

    // --- Validation before sending ---
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
        alert("Please correct the errors in the form before calculating.");
        // Ensure the user is on the step with the error? Or navigate back?
        // For simplicity, we just alert and stop.
        return;
    }

    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Calculating...';
    // Show loading state in results area
    resultsDiv.innerHTML = '<div class="invoice-loading"><p>Generating estimate...</p></div>';
    // Immediately navigate to results step to show loading indicator
    navigateWizard('next');


    const payload = gatherFormData();
    console.log('[Client] Sending payload:', JSON.stringify(payload, null, 2)); // Pretty print JSON

    try {
        // *** Use the API endpoint defined in server.js ***
        const response = await fetch('/api/calculate', { // Updated endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json(); // Try parsing JSON regardless of status

        if (!response.ok) {
            // Use error message from server response if available
            const errorMessage = responseData?.message || responseData?.error || `API Error (${response.status})`;
            throw new Error(errorMessage);
        }

        console.log('[Client] Received calculation results:', responseData);
        displayResults(responseData); // Display results uses the server's response
        // Navigation to step 4 already happened before fetch

    } catch (error) {
        console.error('[Client] Error during calculation request:', error);
        displayError(`Calculation Failed: ${error.message}`);
        // Optionally navigate back to the last input step (Step 3)
         if (currentStep === 4) navigateWizard('prev');
    } finally {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate Estimate';
    }
}

/** Format currency helper */
const formatCurrency = (value) => {
    const number = Number(value); // Allow potential string numbers
    if (isNaN(number)) {
        console.warn(`[Client] Invalid value passed to formatCurrency: ${value}`);
        return '$0.00'; // Or some other indicator
    }
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

/** Display error message in the results area */
function displayError(message) {
    resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong> ${message}</p></div>`;
    // Ensure results step is active if error happens after navigation
    if (currentStep !== 4) {
        // Force navigation to step 4 to show the error
         const currentActive = wizard.querySelector('.wizard-step.active');
         const resultsStep = wizard.querySelector('#step-4');
         if (currentActive && resultsStep && currentActive !== resultsStep) {
             currentActive.classList.remove('active', 'hiding');
             resultsStep.classList.add('active');
             currentStep = 4;
         }
    }
     if(printButtonContainer) printButtonContainer.style.display = 'none'; // Hide print on error
}


/** Display calculation results in the results div */
function displayResults(data) {
    console.log("[Client] Displaying results:", data);
    if (!data || typeof data !== 'object') {
        console.error("[Client] Invalid results data received:", data);
        displayError('Received invalid results data from the server.');
        return;
    }

    // Destructure results, providing defaults
    const {
        overallTotal = 0,
        doorCostTotal = 0,
        hingeCost = 0,
        hingeCount = 0, // Get hinge count
        lazySusanCost = 0, // Get LS cost from results
        specialFeatures = {},
        sections = [],
        part2 = {}, // Use part2 from results for display consistency
        part3 = {}  // Use part3 from results
    } = data;

    const customPaintCost = specialFeatures?.customPaintCost || 0;

    // --- Section Breakdown Table ---
    let sectionsHtml = `<h3>Section Breakdown</h3>`;
    if (sections.length > 0) {
        sectionsHtml += `<table class="details-table">
            <thead><tr><th>#</th><th>Door Style</th><th>Drawer Style</th><th>Finish</th><th>HxW (in)</th><th>Area (sqft)</th><th>Cost</th></tr></thead>
            <tbody>`;
        sections.forEach((s, i) => {
            sectionsHtml += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.doorStyle || 'N/A'}</td>
                    <td>${(s.drawerStyle && s.drawerStyle !== s.doorStyle) ? s.drawerStyle : '-'}</td>
                    <td>${s.finish || 'N/A'}</td>
                    <td>${s.height || 0}" x ${s.width || 0}"</td>
                    <td>${s.area?.toFixed(2) || 'N/A'}</td>
                    <td>${formatCurrency(s.totalSectionCost)}</td>
                </tr>
            `;
        });
        sectionsHtml += `</tbody></table>`;
    } else {
        sectionsHtml += `<p style="text-align: center; color: #666;">No sections were entered.</p>`;
    }

    // --- Counts & Features Summary Table ---
    let countsHtml = `<h3 style="margin-top: 1.5em;">Counts & Features Summary</h3>`;
    countsHtml += `<table class="details-table"><tbody>
        <tr><td>Doors 0-36" Qty</td><td>${part2.doors_0_36 || 0}</td></tr>
        <tr><td>Doors 36-60" Qty</td><td>${part2.doors_36_60 || 0}</td></tr>
        <tr><td>Doors 60-82" Qty</td><td>${part2.doors_60_82 || 0}</td></tr>
        <tr><td>Total Drawers</td><td>${part2.numDrawers || 0}</td></tr>
        <tr><td>Lazy Susans</td><td>${part2.lazySusanQty || 0}</td></tr>
        <tr><td>Custom Paint Colors</td><td>${part3.customPaintQty || 0}</td></tr>
        <tr><td><b>Total Hinges Needed</b></td><td><b>${hingeCount}</b></td></tr> <!-- Added Hinge Count -->
    </tbody></table>`;


    // --- Cost Summary Table ---
    let costSummaryHtml = `<h3 style="margin-top: 1.5em;">Cost Summary</h3>`;
    costSummaryHtml += `
        <table class="summary-table">
            <tbody>
                <tr><td class="table-label">Door & Drawer Section Cost</td><td class="table-value">${formatCurrency(doorCostTotal)}</td></tr>
                <tr><td class="table-label">Hinge Boring Cost</td><td class="table-value">${formatCurrency(hingeCost)}</td></tr>
    `;
    // Only show rows for costs > 0
    if (lazySusanCost > 0) {
        costSummaryHtml += `<tr><td class="table-label">Lazy Susan Cost</td><td class="table-value">${formatCurrency(lazySusanCost)}</td></tr>`;
    }
    if (customPaintCost > 0) {
        costSummaryHtml += `<tr><td class="table-label">Custom Paint Fee</td><td class="table-value">${formatCurrency(customPaintCost)}</td></tr>`;
    }
    costSummaryHtml += `
            </tbody>
            <tfoot>
                <tr class="total-row"><td class="table-label">Estimated Total</td><td class="table-value">${formatCurrency(overallTotal)}</td></tr>
            </tfoot>
        </table>
    `;

    // --- Construct Final Invoice HTML ---
    resultsDiv.innerHTML = `
      <div class="invoice">
          <div class="invoice-header">
               <!-- Optional: Add logo for invoice -->
               <!-- <img src="/assets/logo.png" alt="nuDoors Logo" class="invoice-logo" style="display: block; max-height: 60px; margin: 0 auto 1em auto;"> -->
              <h1>Estimate Summary</h1>
              <p>Thank you for using the nuDoors Estimator!</p>
              <p>Estimate ID: ${Date.now()}</p> <!-- Add a simple timestamp ID -->
          </div>

          ${sectionsHtml}  <!-- Add Section Breakdown Table -->
          ${countsHtml}    <!-- Add Counts Table -->
          ${costSummaryHtml} <!-- Add Cost Summary Table -->

          <!-- REMOVED TOGGLE BUTTON DIV -->

          <div class="estimate-footer">
              <p>This is an estimate only. Final price may vary based on final measurements, selections, and confirmation. Tax not included.</p>
          </div>
      </div>
    `;

    // Show Print button container
    if (printButtonContainer) printButtonContainer.style.display = 'block';
}


/** Toggle visibility of the example image */
function handleToggleExample() {
    if (!exampleImageDiv || !toggleExampleBtn) return;
    const isHidden = exampleImageDiv.style.display === 'none';
    exampleImageDiv.style.display = isHidden ? 'block' : 'none';
    toggleExampleBtn.textContent = isHidden ? 'Hide Example Image' : 'Show Example Image';
}

/** Reset the entire form and state, return to step 1 */
function handleStartOver() {
    console.log('[Client] Starting over.');

    // 1. Reset input fields in all relevant steps
    document.querySelectorAll('#step-1 input, #step-1 select, #step-2 input, #step-3 input').forEach(input => {
        // Reset specific types differently
        if (input.type === 'number') {
            input.value = input.name === 'sectionHeight' || input.name === 'sectionWidth' ? '12' : '0'; // Reset numbers to 0 or default 12
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0; // Reset selects to the first option
        }
        input.style.border = ''; // Clear validation borders
    });

    // 2. Clear dynamic sections and re-initialize
    sectionsContainer.innerHTML = '';
    sectionCounter = 0;
    initializeSections(); // Add back the first section (and potentially repopulate styles if needed)

    // 3. Clear results area
    resultsDiv.innerHTML = '';
    if(printButtonContainer) printButtonContainer.style.display = 'none'; // Hide print btn

    // 4. Reset wizard to step 1 visually
    const currentActive = wizard.querySelector('.wizard-step.active');
    const firstStep = wizard.querySelector('#step-1');
    if (currentActive && firstStep && currentActive !== firstStep) {
        currentActive.classList.remove('active', 'hiding');
        firstStep.classList.add('active');
    }
    currentStep = 1;

    // 5. Reset calculate button state
    if (calculateBtn) {
        calculateBtn.disabled = false;
        calculateBtn.textContent = 'Calculate Estimate';
    }

     // Scroll to top
     window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Initialize the sections area (add first section) */
function initializeSections() {
     // Clear any existing sections first (important for start over)
     sectionsContainer.innerHTML = '';
     sectionCounter = 0;
     // Add the initial section only if styles are loaded
     if (allStyles.length > 0) {
         handleAddSection(); // Add the first section
     } else {
         console.warn('[Client] Cannot initialize sections, styles not loaded yet.');
         // Display a message in the sections container
         sectionsContainer.innerHTML = '<p class="invoice-loading">Loading styles...</p>';
     }
     updateSectionNumbers(); // Ensure remove button state is correct even for one section
}

/** Set up wizard navigation and general button listeners */
function initializeWizard() {
    console.log('[Client] Initializing wizard UI listeners...');

    // Navigation Buttons (using event delegation on the wizard container)
    wizard.addEventListener('click', (event) => {
        if (event.target.matches('.wizard-nav-btn.next')) {
            // Prevent Step 3 'Next' button from navigating (handled by Calculate)
            if(currentStep === 3) return;
            navigateWizard('next');
        } else if (event.target.matches('.wizard-nav-btn.prev')) {
            navigateWizard('prev');
        }
    });

    // Specific Action Buttons
    if(addSectionBtn) addSectionBtn.addEventListener('click', handleAddSection);
    if(calculateBtn) calculateBtn.addEventListener('click', handleCalculate);
    if(startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
    if(printBtn) printBtn.addEventListener('click', () => window.print());
    if(toggleExampleBtn) toggleExampleBtn.addEventListener('click', handleToggleExample);

    // Listener for removing sections (using event delegation on the container)
    if(sectionsContainer) sectionsContainer.addEventListener('click', handleRemoveSection);

    // Set initial visual state (redundant if HTML is correct, but safe)
    steps.forEach((step, index) => {
        step.classList.remove('active', 'hiding');
        if (index === currentStep - 1) { // Use currentStep variable
            step.classList.add('active');
        }
    });
    if(printButtonContainer) printButtonContainer.style.display = 'none'; // Hide print initially

    console.log('[Client] Wizard UI Initialized.');
}

/** Initial setup when DOM is ready */
function main() {
    console.log('[Client] DOM Loaded. App initializing...');

    // Get references to major elements
    wizard = document.getElementById('wizard');
    steps = wizard?.querySelectorAll('.wizard-step');
    sectionsContainer = document.getElementById('sectionsContainer');
    addSectionBtn = document.getElementById('addSectionBtn');
    calculateBtn = document.getElementById('calculateBtn');
    resultsDiv = document.getElementById('results');
    startOverBtn = document.getElementById('startOverBtn');
    printBtn = document.getElementById('printEstimate');
    printButtonContainer = document.getElementById('printButtonContainer');
    toggleExampleBtn = document.getElementById('toggleExampleBtn');
    exampleImageDiv = document.getElementById('exampleImage');
    themeToggleBtn = document.getElementById('themeToggleBtn'); // Get theme button reference

    // Check if essential elements exist before proceeding
    const criticalElements = [wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printBtn, toggleExampleBtn, exampleImageDiv, themeToggleBtn];
    if (!steps || steps.length === 0 || criticalElements.some(el => !el)) {
        console.error("[Client] Critical UI elements missing from the DOM. Aborting initialization.", {
            wizard: !!wizard, steps: steps?.length, sectionsContainer: !!sectionsContainer, addSectionBtn: !!addSectionBtn, calculateBtn: !!calculateBtn, resultsDiv: !!resultsDiv, startOverBtn: !!startOverBtn, printBtn: !!printBtn, toggleExampleBtn: !!toggleExampleBtn, exampleImageDiv: !!exampleImageDiv, themeToggleBtn: !!themeToggleBtn
        });
        document.body.innerHTML = '<p style="color: red; font-weight: bold; padding: 2em;">Error: UI is incomplete. Cannot start the estimator. Check element IDs.</p>';
        return; // Stop execution
    }


    // --- Add Theme Listener ---
    themeToggleBtn.addEventListener('click', handleThemeToggle);

    // --- Load initial theme ---
    loadInitialTheme(); // Load theme before fetching data

    // Start the process by fetching data, which then initializes UI
    initPricingData();
}

// --- Run the main setup function ---
// Use DOMContentLoaded for standard behavior
document.addEventListener('DOMContentLoaded', main);