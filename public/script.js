// --- FILE: public/script.js (FULL FILE - CORRECTED) ---

// Global variables
let pricingData = null;
let styleMap = {};
let allStyles = [];
let currentStep = 1;
let sectionCounter = 0;

// --- DOM Element References ---
let wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn,  toggleExampleBtn, exampleImageDiv, printButtonContainer, themeToggleBtn;

// --- Theme Handling ---
const K_THEME = 'nuDoorsEstimatorTheme';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.dataset.theme = 'dark';
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙';
        localStorage.setItem(K_THEME, 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️';
        localStorage.setItem(K_THEME, 'light');
    }
    console.log(`[Client] Theme applied: ${theme}`);
}

function handleThemeToggle() {
    const currentTheme = document.body.dataset.theme;
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(K_THEME) || 'light';
    themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn');
    applyTheme(savedTheme);
}
// --- End Theme Handling ---


/** Build style list and optionally a map */
function processPricingData(data) {
    const list = [];
    const map = {};
    if (!data || !Array.isArray(data.doorPricingGroups)) {
        console.error("[Client] Invalid pricing data received:", data);
        return { map: {}, list: [] };
    }
    for (const group of data.doorPricingGroups) {
        if (!group || !Array.isArray(group.styles)) continue;
        for (const style of group.styles) {
             if (typeof style === 'string' && !list.includes(style)) {
                list.push(style);
                map[style] = { Painted: group.Painted, Primed: group.Primed, Unfinished: group.Unfinished };
            }
        }
    }
    return { map, list: list.sort() };
}

/** Populate style dropdowns */
function populateStyleDropdowns(container) {
    const doorSelect = container.querySelector('select[name="sectionDoorStyle"]');
    const drawerSelect = container.querySelector('select[name="sectionDrawerStyle"]');
    if (!doorSelect || !drawerSelect) {
        console.warn("[Client] Could not find style select elements in container:", container);
        return;
    }
    if (allStyles.length === 0) {
         console.warn("[Client] Cannot populate dropdowns, no styles available.");
         doorSelect.innerHTML = '<option value="">Error loading styles</option>';
         drawerSelect.innerHTML = '<option value="">Error loading styles</option>';
         return;
    }
    const optionsHtml = allStyles.map(style => `<option value="${style}">${style}</option>`).join('');
    doorSelect.innerHTML = optionsHtml;
    drawerSelect.innerHTML = optionsHtml;
     if (allStyles.length > 0) {
        doorSelect.value = allStyles[0];
        drawerSelect.value = allStyles[0];
     }
}

/** Fetch pricing data */
async function initPricingData() {
    try {
        console.log('[Client] Fetching pricing data for styles...');
        const res = await fetch('/data/pricingData.json');
        if (!res.ok) { throw new Error(`HTTP error! status: ${res.status} while fetching pricing data.`); }
        pricingData = await res.json();
        if (!pricingData || !pricingData.doorPricingGroups) { throw new Error('Fetched pricing data is invalid or missing doorPricingGroups.'); }

        const { map, list } = processPricingData(pricingData);
        styleMap = map;
        allStyles = list;
        console.log('[Client] Pricing data loaded. Styles available:', allStyles.length);

        initializeSections();
        initializeWizard();

    } catch (e) {
        console.error('[Client] Failed to load or process pricing data:', e);
        displayError("Could not load essential configuration data. Please try refreshing the page.");
        if (calculateBtn) calculateBtn.disabled = true;
    }
}

/** Create HTML structure for a single section - WITH NEW FINISH OPTIONS */
function createRoughEstimateSection(index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index; // Use index for data tracking
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
        <option value="Painted" selected>Painted (Standard Colors)</option>
        <option value="Accessible Beige 7036">Accessible Beige 7036</option>
        <option value="Card Room Green No.79">Card Room Green No.79</option>
        <option value="BM White Dove OC-17">BM White Dove OC-17</option>
        <option value="Kendall Charcoal HC-166">Kendall Charcoal HC-166</option>
        <option value="Van Deusen Blue">Van Deusen Blue</option>
        <option value="Stock White/ Decorator's White">Stock White/ Decorator's White</option>
        <option value="Custom Color">Custom Color (Match Fee May Apply)</option>
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
    populateStyleDropdowns(sectionDiv); // Populate styles for this new section
    return sectionDiv;
} // <--- MAKE SURE THIS CLOSING BRACE IS HERE AND NOT INSIDE ANOTHER FUNCTION

/** Add a new section */
function handleAddSection() {
    console.log(`[Client] Adding section ${sectionCounter + 1}`);
    const newSection = createRoughEstimateSection(sectionCounter);
    sectionsContainer.appendChild(newSection);
    sectionCounter++;
    updateSectionNumbers();
}

/** Remove a section */
function handleRemoveSection(event) {
    const removeButton = event.target.closest('.remove-button');
    if (removeButton) {
        const sectionToRemove = removeButton.closest('.section');
        if (sectionToRemove) {
            const indexToRemove = sectionToRemove.dataset.index;
            console.log(`[Client] Removing section with index ${indexToRemove}`);
            sectionToRemove.remove();
            updateSectionNumbers();
        }
    }
}

/** Update section numbers */
function updateSectionNumbers() {
     const remainingSections = sectionsContainer.querySelectorAll('.section');
     remainingSections.forEach((section, i) => {
         const idSpan = section.querySelector('.section-id');
         const removeBtn = section.querySelector('.remove-button');
         const index = i;
         if (idSpan) idSpan.textContent = `Section ${index + 1}`;
         section.dataset.index = index;
         section.querySelectorAll('[id^="section-"]').forEach(el => {
             const oldId = el.id;
             const namePart = oldId.substring(oldId.lastIndexOf('-') + 1);
             const newId = `section-${index}-${namePart}`;
             el.id = newId;
             const label = section.querySelector(`label[for="${oldId}"]`);
             if(label) label.setAttribute('for', newId);
         });
         if (removeBtn) {
             removeBtn.dataset.removeIndex = index;
             removeBtn.title = `Remove Section ${index + 1}`;
         }
     });
     sectionCounter = remainingSections.length;
     console.log('[Client] Section count updated to:', sectionCounter);
     const removeButtons = sectionsContainer.querySelectorAll('.remove-button');
     removeButtons.forEach(btn => btn.disabled = (remainingSections.length <= 1));
}

/** Wizard Navigation Logic */
function navigateWizard(direction) {
    const currentStepElement = wizard.querySelector(`.wizard-step.active`);
    if (!currentStepElement) { console.error('[Client] Cannot navigate, active step not found.'); return; }

    const targetStepNum = direction === 'next' ? currentStep + 1 : currentStep - 1;

    if (direction === 'next' && currentStep === 1 && !validateStep1()) { return; }
    if (direction === 'next' && currentStep === 2 && !validateStep2()) { return; }
    if (targetStepNum < 1 || targetStepNum > steps.length) { console.warn('[Client] Navigation attempt out of bounds.'); return; }

    const targetStepElement = wizard.querySelector(`#step-${targetStepNum}`);
    if (targetStepElement) {
        currentStepElement.classList.add('hiding');
        currentStepElement.classList.remove('active');
        setTimeout(() => { currentStepElement.classList.remove('hiding'); }, 400);
        targetStepElement.classList.add('active');
        currentStep = targetStepNum;
        console.log(`[Client] Navigated to step ${currentStep}`);
        wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
         console.error(`[Client] Wizard step element not found for target step ${targetStepNum}`);
    }
}

// --- Input Validation Functions ---
function validateStep1() { /* ... no changes ... */
    let isValid = true;
    const sectionElements = sectionsContainer.querySelectorAll('.section');
    if (sectionElements.length === 0) { alert("Please add at least one section."); isValid = false; return isValid; }
    sectionElements.forEach((sectionEl) => {
        const heightInput = sectionEl.querySelector('[name="sectionHeight"]');
        const widthInput = sectionEl.querySelector('[name="sectionWidth"]');
        const height = parseFloat(heightInput.value);
        const width = parseFloat(widthInput.value);
        heightInput.style.border = ''; widthInput.style.border = '';
        if (isNaN(height) || height <= 0) { heightInput.style.border = '2px solid red'; isValid = false; }
        if (isNaN(width) || width <= 0) { widthInput.style.border = '2px solid red'; isValid = false; }
    });
    if (!isValid) { alert("Please ensure all section dimensions (Height and Width) are numbers greater than 0."); }
    return isValid;
 }
function validateStep2() { /* ... no changes ... */
    let isValid = true;
    const step2Inputs = document.querySelectorAll('#step-2 input[type="number"]');
    step2Inputs.forEach(input => {
        const value = parseInt(input.value, 10);
        input.style.border = '';
        if (isNaN(value) || value < 0) { input.style.border = '2px solid red'; isValid = false; }
    });
    if (!isValid) { alert("Please ensure all piece counts are whole numbers (0 or greater)."); }
    return isValid;
 }
function validateStep3() { /* ... no changes ... */
    let isValid = true;
    const customPaintInput = document.querySelector('#step-3 input[name="customPaintQty"]');
    const value = parseInt(customPaintInput.value, 10);
    customPaintInput.style.border = '';
    if (isNaN(value) || value < 0) { customPaintInput.style.border = '2px solid red'; isValid = false; alert("Please ensure Custom Paint Quantity is a whole number (0 or greater)."); }
    return isValid;
 }
// --- End Validation ---


/** Gather data from all relevant input fields */
function gatherFormData() { /* ... no changes ... */
    const formData = { sections: [], part2: {}, part3: {} };
    const sectionElements = sectionsContainer.querySelectorAll('.section');
    sectionElements.forEach((sectionEl, index) => {
        const sectionData = {
            doorStyle: sectionEl.querySelector('[name="sectionDoorStyle"]').value,
            drawerStyle: sectionEl.querySelector('[name="sectionDrawerStyle"]').value,
            finish: sectionEl.querySelector('[name="sectionFinish"]').value,
            height: sectionEl.querySelector('[name="sectionHeight"]').value,
            width: sectionEl.querySelector('[name="sectionWidth"]').value
        };
        formData.sections.push(sectionData);
    });
    const step2Container = document.getElementById('step-2');
    if (step2Container) {
         formData.part2.numDrawers = step2Container.querySelector('#numDrawers')?.value ?? '0';
         formData.part2.doors_0_36 = step2Container.querySelector('#doors_0_36')?.value ?? '0';
         formData.part2.doors_36_60 = step2Container.querySelector('#doors_36_60')?.value ?? '0';
         formData.part2.doors_60_82 = step2Container.querySelector('#doors_60_82')?.value ?? '0';
         formData.part2.lazySusanQty = step2Container.querySelector('#lazySusanQty')?.value ?? '0';
    } else { console.warn("[Client] Step 2 container not found."); }
    const step3Container = document.getElementById('step-3');
    if (step3Container) {
         formData.part3.customPaintQty = step3Container.querySelector('#customPaintQty')?.value ?? '0';
    } else { console.warn("[Client] Step 3 container not found."); }
    return formData;
 }

/** Handle the calculation request */
async function handleCalculate() { /* ... no changes ... */
    console.log('[Client] Calculate button clicked.');
    if (!validateStep1() || !validateStep2() || !validateStep3()) { alert("Please correct the errors in the form before calculating."); return; }
    calculateBtn.disabled = true; calculateBtn.textContent = 'Calculating...';
    resultsDiv.innerHTML = '<div class="invoice-loading"><p>Generating estimate...</p></div>';
    navigateWizard('next');
    const payload = gatherFormData();
    console.log('[Client] Sending payload:', JSON.stringify(payload, null, 2));
    try {
        const response = await fetch('/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload), });
        const responseData = await response.json();
        if (!response.ok) { const errorMessage = responseData?.message || responseData?.error || `API Error (${response.status})`; throw new Error(errorMessage); }
        console.log('[Client] Received calculation results:', responseData);
        displayResults(responseData);
    } catch (error) {
        console.error('[Client] Error during calculation request:', error);
        displayError(`Calculation Failed: ${error.message}`);
        if (currentStep === 4) navigateWizard('prev');
    } finally {
        calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate';
    }
 }

/** Format currency helper */
const formatCurrency = (value) => { /* ... no changes ... */
    const number = Number(value);
    if (isNaN(number)) { console.warn(`[Client] Invalid value passed to formatCurrency: ${value}`); return '$0.00'; }
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

/** Display error message in the results area */
function displayError(message) { /* ... no changes ... */
    resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong> ${message}</p></div>`;
    if (currentStep !== 4) {
         const currentActive = wizard.querySelector('.wizard-step.active');
         const resultsStep = wizard.querySelector('#step-4');
         if (currentActive && resultsStep && currentActive !== resultsStep) { currentActive.classList.remove('active', 'hiding'); resultsStep.classList.add('active'); currentStep = 4; }
    }
     if(printButtonContainer) printButtonContainer.style.display = 'none';
 }


/** Display calculation results in the results div - WITH data-labels */
function displayResults(data) { /* ... JS from step 1 ... */
    // (ensure this function uses the version from step 1 with data-labels)
    console.log("[Client] displayResults starting. Target element should be:", resultsDiv);
    if (!resultsDiv) { console.error("[Client] CRITICAL: resultsDiv element is null!"); return; }
    console.log("[Client] displayResults received data:", data);

    if (!data || typeof data !== 'object') { console.error("[Client] Invalid results data received:", data); displayError('Received invalid results data from the server.'); return; }

    const { overallTotal = 0, doorCostTotal = 0, hingeCost = 0, hingeCount = 0, lazySusanCost = 0, specialFeatures = {}, sections = [], part2 = {}, part3 = {} } = data;
    const customPaintCost = specialFeatures?.customPaintCost || 0;

    let sectionsHtml = `<h3>Section Breakdown</h3>`;
    if (sections.length > 0) {
        sectionsHtml += `<table class="details-table"><thead><tr><th>#</th><th>Door Style</th><th>Drawer Style</th><th>Finish</th><th>HxW (in)</th><th>Area (sqft)</th><th>Cost</th></tr></thead><tbody>`;
        sections.forEach((s, i) => {
            const drawerStyleText = (s.drawerStyle && s.drawerStyle !== s.doorStyle) ? s.drawerStyle : '-';
            sectionsHtml += `<tr class="primary-info-row"><td data-label="#">${i + 1}</td><td data-label="Door Style">${s.doorStyle || 'N/A'}</td><td data-label="Drawer Style">${drawerStyleText}</td><td data-label="Finish">${s.finish || 'N/A'}</td><td data-label="HxW (in)">${s.height || 0}" x ${s.width || 0}"</td><td data-label="Area (sqft)">${s.area?.toFixed(2) || 'N/A'}</td><td data-label="Cost">${formatCurrency(s.totalSectionCost)}</td></tr>`;
        });
        sectionsHtml += `</tbody></table>`;
    } else { sectionsHtml += `<p style="text-align: center; color: #666;">No sections were entered.</p>`; }

    let countsHtml = `<h3 style="margin-top: 1.5em;">Counts & Features Summary</h3><table class="details-table"><tbody><tr><td>Doors 0-36" Qty</td><td>${part2.doors_0_36 || 0}</td></tr><tr><td>Doors 36-60" Qty</td><td>${part2.doors_36_60 || 0}</td></tr><tr><td>Doors 60-82" Qty</td><td>${part2.doors_60_82 || 0}</td></tr><tr><td>Total Drawers</td><td>${part2.numDrawers || 0}</td></tr><tr><td>Lazy Susans</td><td>${part2.lazySusanQty || 0}</td></tr><tr><td>Custom Paint Colors</td><td>${part3.customPaintQty || 0}</td></tr><tr><td><b>Total Hinges Needed</b></td><td><b>${hingeCount}</b></td></tr></tbody></table>`;
    let costSummaryHtml = `<h3 style="margin-top: 1.5em;">Cost Summary</h3><table class="summary-table"><tbody><tr><td class="table-label" data-label="Door & Drawer Section Cost">Door & Drawer Section Cost</td><td class="table-value">${formatCurrency(doorCostTotal)}</td></tr><tr><td class="table-label" data-label="Hinge Boring Cost">Hinge Boring Cost</td><td class="table-value">${formatCurrency(hingeCost)}</td></tr>`;
    if (lazySusanCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Lazy Susan Cost">Lazy Susan Cost</td><td class="table-value">${formatCurrency(lazySusanCost)}</td></tr>`;
    if (customPaintCost > 0) costSummaryHtml += `<tr><td class="table-label" data-label="Custom Paint Fee">Custom Paint Fee</td><td class="table-value">${formatCurrency(customPaintCost)}</td></tr>`;
    costSummaryHtml += `</tbody><tfoot><tr class="total-row"><td class="table-label">Estimated Total</td><td class="table-value">${formatCurrency(overallTotal)}</td></tr></tfoot></table>`;

    const finalHtml = `<div class="invoice"><div class="invoice-header"><h1>Estimate Summary</h1><p>Thank you for using the nuDoors Estimator!</p><p>Estimate ID: ${Date.now()}</p></div>${sectionsHtml}${countsHtml}${costSummaryHtml}<div class="estimate-footer"><p>This is an estimate only... Tax not included.</p></div></div>`;

    console.log("[Client] About to set innerHTML for resultsDiv.");
    resultsDiv.innerHTML = finalHtml;
    console.log("[Client] Finished setting innerHTML. resultsDiv parent:", resultsDiv.parentElement);
    console.log("[Client] Is resultsDiv still connected to document?", document.body.contains(resultsDiv));

    if (printButtonContainer) printButtonContainer.style.display = 'block';
 } // <--- MAKE SURE THIS CLOSING BRACE IS HERE

/** Toggle visibility of the example image */
function handleToggleExample() { /* ... no changes ... */
    if (!exampleImageDiv || !toggleExampleBtn) return;
    const isHidden = exampleImageDiv.style.display === 'none';
    exampleImageDiv.style.display = isHidden ? 'block' : 'none';
    toggleExampleBtn.textContent = isHidden ? 'Hide Example Image' : 'Show Example Image';
 }

/** Reset the entire form and state */
function handleStartOver() { /* ... no changes ... */
    console.log('[Client] Starting over.');
    document.querySelectorAll('#step-1 input, #step-1 select, #step-2 input, #step-3 input').forEach(input => {
        if (input.type === 'number') { input.value = input.name === 'sectionHeight' || input.name === 'sectionWidth' ? '12' : '0'; }
        else if (input.tagName === 'SELECT') { input.selectedIndex = 0; }
        input.style.border = '';
    });
    sectionsContainer.innerHTML = ''; sectionCounter = 0;
    initializeSections();
    resultsDiv.innerHTML = '';
    if(printButtonContainer) printButtonContainer.style.display = 'none';
    const currentActive = wizard.querySelector('.wizard-step.active');
    const firstStep = wizard.querySelector('#step-1');
    if (currentActive && firstStep && currentActive !== firstStep) { currentActive.classList.remove('active'); firstStep.classList.add('active'); }
    currentStep = 1;
    if (calculateBtn) { calculateBtn.disabled = false; calculateBtn.textContent = 'Calculate Estimate'; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
 }

/** Initialize the sections area */
function initializeSections() { /* ... no changes ... */
     sectionsContainer.innerHTML = ''; sectionCounter = 0;
     if (allStyles.length > 0) { handleAddSection(); }
     else { console.warn('[Client] Cannot initialize sections, styles not loaded yet.'); sectionsContainer.innerHTML = '<p class="invoice-loading">Loading styles...</p>'; }
     updateSectionNumbers();
 }

/** Shared handler for Print/Save buttons */
function handlePrintRequest() { // <--- DEFINE BEFORE initializeWizard
    console.log('[Client] Print/Save button clicked. Triggering window.print().');
    window.print();
} // <--- MAKE SURE THIS CLOSING BRACE IS HERE

/** Set up wizard navigation and general button listeners - WITH NEW PRINT/SAVE */
function initializeWizard() { // <--- START OF initializeWizard
    console.log('[Client] Initializing wizard UI listeners...');

    const printBtnActual = document.getElementById('printEstimate');
    const saveBtn = document.getElementById('saveEstimatePdf');

    wizard.addEventListener('click', (event) => {
        if (event.target.matches('.wizard-nav-btn.next') && currentStep !== 3) { navigateWizard('next'); }
        else if (event.target.matches('.wizard-nav-btn.prev')) { navigateWizard('prev'); }
    });

    if(addSectionBtn) addSectionBtn.addEventListener('click', handleAddSection);
    if(calculateBtn) calculateBtn.addEventListener('click', handleCalculate);
    if(startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
    if(toggleExampleBtn) toggleExampleBtn.addEventListener('click', handleToggleExample);

    if(printBtnActual) { printBtnActual.addEventListener('click', handlePrintRequest); }
    else { console.warn("[Client] Print Estimate button not found."); }
    if(saveBtn) { saveBtn.addEventListener('click', handlePrintRequest); }
    else { console.warn("[Client] Save as PDF button not found."); }

    if(sectionsContainer) sectionsContainer.addEventListener('click', handleRemoveSection);

    steps.forEach((step, index) => {
        step.classList.remove('active', 'hiding');
        if (index === currentStep - 1) { step.classList.add('active'); }
    });
    if(printButtonContainer) printButtonContainer.style.display = 'none';

    console.log('[Client] Wizard UI Initialized.');
} // <--- MAKE SURE THIS CLOSING BRACE IS HERE

/** Initial setup when DOM is ready */
function main() { /* ... no changes ... */
    console.log('[Client] DOM Loaded. App initializing...');
    wizard = document.getElementById('wizard');
    steps = wizard?.querySelectorAll('.wizard-step');
    sectionsContainer = document.getElementById('sectionsContainer');
    addSectionBtn = document.getElementById('addSectionBtn');
    calculateBtn = document.getElementById('calculateBtn');
    resultsDiv = document.getElementById('results');
    startOverBtn = document.getElementById('startOverBtn');
    // printBtn = document.getElementById('printEstimate'); // Reference handled in initializeWizard
    printButtonContainer = document.getElementById('printButtonContainer');
    toggleExampleBtn = document.getElementById('toggleExampleBtn');
    exampleImageDiv = document.getElementById('exampleImage');
    themeToggleBtn = document.getElementById('themeToggleBtn');

    const criticalElements = [wizard, steps, sectionsContainer, addSectionBtn, calculateBtn, resultsDiv, startOverBtn, printButtonContainer, /* printBtn, (not critical here) */ toggleExampleBtn, exampleImageDiv, themeToggleBtn];
    if (!steps || steps.length === 0 || criticalElements.some(el => !el)) {
        console.error("[Client] Critical UI elements missing from the DOM. Aborting initialization.", { wizard: !!wizard, steps: steps?.length, sectionsContainer: !!sectionsContainer, addSectionBtn: !!addSectionBtn, calculateBtn: !!calculateBtn, resultsDiv: !!resultsDiv, startOverBtn: !!startOverBtn, printButtonContainer: !!printButtonContainer, toggleExampleBtn: !!toggleExampleBtn, exampleImageDiv: !!exampleImageDiv, themeToggleBtn: !!themeToggleBtn });
        document.body.innerHTML = '<p style="color: red; font-weight: bold; padding: 2em;">Error: UI is incomplete. Check element IDs.</p>';
        return;
    }
    themeToggleBtn.addEventListener('click', handleThemeToggle);
    loadInitialTheme();
    initPricingData();
}

// --- Run the main setup function ---
document.addEventListener('DOMContentLoaded', main);